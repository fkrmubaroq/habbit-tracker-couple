import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Full detail stays in the server log; the response never carries it unless
  // the handler deliberately set a status.
  console.error("Pomodoro API Error:", err);

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: "Validasi data gagal",
      details: formattedErrors,
    });
  }

  // An explicit status means the code chose to reject this request with a
  // message meant for the caller. Anything else is an unexpected failure — a
  // driver error, for instance — whose `message` can name tables, constraints
  // and primary-key values (e.g. "Duplicate entry '…' for key
  // 'pomodoro_settings.PRIMARY'"). Those must not reach the client, especially
  // since the web app surfaces `error` straight into a toast.
  const explicitStatus =
    typeof err.statusCode === "number"
      ? err.statusCode
      : typeof err.status === "number"
        ? err.status
        : undefined;

  const statusCode = explicitStatus ?? 500;
  const message =
    explicitStatus !== undefined
      ? err.message || "Terjadi kesalahan internal pada server"
      : "Terjadi kesalahan internal pada server";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
