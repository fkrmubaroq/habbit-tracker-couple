#!/usr/bin/env bash
set -e

# --- Direktori Project ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# --- Load Konfigurasi (.env.deploy) ---
if [ -f "${SCRIPT_DIR}/.env.deploy" ]; then
    # shellcheck disable=SC1091
    source "${SCRIPT_DIR}/.env.deploy"
elif [ -f "${ROOT_DIR}/.env.deploy" ]; then
    # shellcheck disable=SC1091
    source "${ROOT_DIR}/.env.deploy"
fi

VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:-}"
VPS_PORT="${VPS_PORT:-22}"
VPS_SSH_KEY="${VPS_SSH_KEY:-}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/habbit-tracker}"

# Cek Host VPS
if [ -z "$VPS_HOST" ]; then
    read -rp "Masukkan IP / Host VPS: " VPS_HOST
    if [ -z "$VPS_HOST" ]; then
        echo "Error: Host VPS tidak boleh kosong!"
        exit 1
    fi
fi

# SSH Multiplexing Socket (Agar password hanya diminta 1x)
SSH_MUX_SOCKET="/tmp/ssh_mux_${VPS_USER}_${VPS_HOST}_$$"

cleanup() {
    if [ -e "$SSH_MUX_SOCKET" ]; then
        ssh -O exit -o "ControlPath=${SSH_MUX_SOCKET}" "${VPS_USER}@${VPS_HOST}" 2>/dev/null || true
        rm -f "$SSH_MUX_SOCKET" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

# Opsi SSH & SCP yang menggunakan shared socket
SSH_OPTS=("-p" "$VPS_PORT" "-o" "ControlPath=${SSH_MUX_SOCKET}")
SCP_OPTS=("-P" "$VPS_PORT" "-o" "ControlPath=${SSH_MUX_SOCKET}")

if [ -n "$VPS_SSH_KEY" ]; then
    SSH_OPTS+=("-i" "$VPS_SSH_KEY")
    SCP_OPTS+=("-i" "$VPS_SSH_KEY")
fi

echo "=========================================="
echo "🚀 1. Memulai Build Frontend & Backend..."
echo "=========================================="
cd "${ROOT_DIR}"
pnpm turbo run build

echo ""
echo "=========================================="
echo "🔑 2. Membuka Koneksi SSH..."
echo "=========================================="
echo "→ Masukkan password VPS di bawah (cukup 1x untuk semua transfer file):"
ssh -p "$VPS_PORT" ${VPS_SSH_KEY:+-i "$VPS_SSH_KEY"} -M -S "$SSH_MUX_SOCKET" -f -N "${VPS_USER}@${VPS_HOST}"

echo ""
echo "=========================================="
echo "📁 3. Menyiapkan Folder di VPS..."
echo "=========================================="
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "mkdir -p ${REMOTE_PATH}/frontend ${REMOTE_PATH}/backend"

echo ""
echo "=========================================="
echo "📦 4. Mengirim File (/dist, package.json, pnpm-lock.yaml)..."
echo "=========================================="

echo "→ Mengirim backend (apps/habbit-tracker-api)..."
scp "${SCP_OPTS[@]}" -r "${ROOT_DIR}/apps/habbit-tracker-api/dist" "${VPS_USER}@${VPS_HOST}:${REMOTE_PATH}/backend/"
scp "${SCP_OPTS[@]}" "${ROOT_DIR}/apps/habbit-tracker-api/package.json" "${VPS_USER}@${VPS_HOST}:${REMOTE_PATH}/backend/"
[ -f "${ROOT_DIR}/pnpm-lock.yaml" ] && scp "${SCP_OPTS[@]}" "${ROOT_DIR}/pnpm-lock.yaml" "${VPS_USER}@${VPS_HOST}:${REMOTE_PATH}/backend/"

# Mengirim file .env backend
if [ -f "${ROOT_DIR}/apps/habbit-tracker-api/.env.production" ]; then
    echo "→ Mengirim apps/habbit-tracker-api/.env.production sebagai .env..."
    scp "${SCP_OPTS[@]}" "${ROOT_DIR}/apps/habbit-tracker-api/.env.production" "${VPS_USER}@${VPS_HOST}:${REMOTE_PATH}/backend/.env"
elif [ -f "${ROOT_DIR}/apps/habbit-tracker-api/.env" ]; then
    echo "→ Mengirim apps/habbit-tracker-api/.env..."
    scp "${SCP_OPTS[@]}" "${ROOT_DIR}/apps/habbit-tracker-api/.env" "${VPS_USER}@${VPS_HOST}:${REMOTE_PATH}/backend/.env"
fi

echo "→ Mengirim frontend (apps/habbit-tracker-web)..."
scp "${SCP_OPTS[@]}" -r "${ROOT_DIR}/apps/habbit-tracker-web/dist" "${VPS_USER}@${VPS_HOST}:${REMOTE_PATH}/frontend/"
scp "${SCP_OPTS[@]}" "${ROOT_DIR}/apps/habbit-tracker-web/package.json" "${VPS_USER}@${VPS_HOST}:${REMOTE_PATH}/frontend/"
[ -f "${ROOT_DIR}/pnpm-lock.yaml" ] && scp "${SCP_OPTS[@]}" "${ROOT_DIR}/pnpm-lock.yaml" "${VPS_USER}@${VPS_HOST}:${REMOTE_PATH}/frontend/"

echo ""
echo "=========================================="
echo "⚡ 5. Menginstall Dependencies & Menjalankan Backend (PM2)..."
echo "=========================================="
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" bash << EOF
    cd "${REMOTE_PATH}/backend"

    echo "→ Menginstall dependencies backend..."
    if command -v pnpm >/dev/null 2>&1; then
        pnpm install --prod
    else
        npm install --omit=dev
    fi

    echo "→ Menjalankan / merestart PM2..."
    if command -v pm2 >/dev/null 2>&1; then
        pm2 describe habbit-backend >/dev/null 2>&1 && pm2 restart habbit-backend || pm2 start dist/index.js --name habbit-backend
        pm2 save 2>/dev/null || true
        echo "✓ PM2 backend (habbit-backend) berhasil berjalan/direstart."
    else
        echo "⚠️ PM2 belum terpasang di VPS (dapat diinstall via: npm install -g pm2)."
        echo "ℹ️ Menjalankan sementara di background dengan nohup..."
        pkill -f "dist/index.js" 2>/dev/null || true
        nohup node dist/index.js > backend.log 2>&1 &
    fi
EOF

echo ""
echo "=========================================="
echo "🌐 6. Mengatur Konfigurasi Nginx di VPS..."
echo "=========================================="

NGINX_CONF="${SCRIPT_DIR}/nginx.conf"
if [ ! -f "$NGINX_CONF" ]; then
    NGINX_CONF="${SCRIPT_DIR}/nginx.conf.example"
fi

if [ -f "$NGINX_CONF" ]; then
    echo "→ Mengupload konfigurasi Nginx..."
    scp "${SCP_OPTS[@]}" "$NGINX_CONF" "${VPS_USER}@${VPS_HOST}:/tmp/habbit-tracker-nginx.conf"

    echo "→ Menerapkan konfigurasi & reload Nginx..."
    ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" bash << 'EOF'
        SUDO=""
        if [ "$(id -u)" -ne 0 ]; then
            SUDO="sudo"
        fi

        if [ -d /etc/nginx/sites-available ]; then
            $SUDO mv /tmp/habbit-tracker-nginx.conf /etc/nginx/sites-available/habbit-tracker
            $SUDO ln -sf /etc/nginx/sites-available/habbit-tracker /etc/nginx/sites-enabled/habbit-tracker
        elif [ -d /etc/nginx/conf.d ]; then
            $SUDO mv /tmp/habbit-tracker-nginx.conf /etc/nginx/conf.d/habbit-tracker.conf
        else
            $SUDO mkdir -p /etc/nginx/conf.d
            $SUDO mv /tmp/habbit-tracker-nginx.conf /etc/nginx/conf.d/habbit-tracker.conf
        fi

        if command -v nginx >/dev/null 2>&1; then
            if $SUDO nginx -t; then
                $SUDO systemctl reload nginx 2>/dev/null || $SUDO nginx -s reload 2>/dev/null || true
                echo "✓ Nginx berhasil di-reload dengan konfigurasi terbaru."
            else
                echo "⚠️ Terdapat kesalahan sintaks pada konfigurasi Nginx!"
            fi
        else
            echo "ℹ️ Nginx belum terpasang di VPS. Konfigurasi telah disimpan di /etc/nginx."
        fi
EOF
else
    echo "ℹ️ File scripts/nginx.conf tidak ditemukan, lewati langkah Nginx."
fi

echo ""
echo "=========================================="
echo "🎉 Berhasil Terkirim & Dikonfigurasi!"
echo "Target: ${VPS_USER}@${VPS_HOST}:${REMOTE_PATH}"
echo "=========================================="

