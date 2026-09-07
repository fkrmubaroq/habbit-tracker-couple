#!/usr/bin/env python3
"""Standalone, idempotent teardown for black-box (real DB, over-HTTP) API
tests. Deletes everything tagged with a given test run id/prefix.

Run manually after a crashed test run left data behind, or wire it into
CI as a scheduled sweep. Adapt ENTITY_ENDPOINTS and the delete call to the
project — this is a template, not a drop-in tool.

Usage:
    python cleanup_test_data.py <run_id_or_prefix>
    python cleanup_test_data.py --older-than-hours 24
"""

import argparse
import sys
import urllib.request
import urllib.error
import json

BASE_URL = "http://localhost:3000"  # adjust to the project's API base URL

# List entity types in reverse dependency order (children before parents)
# so deletes don't violate foreign-key constraints. Each entry names the
# list endpoint used to find tagged rows and the delete endpoint template.
ENTITY_ENDPOINTS = [
    # {"name": "order_items", "list": "/api/order-items", "delete": "/api/order-items/{id}"},
    # {"name": "orders", "list": "/api/orders", "delete": "/api/orders/{id}"},
    # {"name": "users", "list": "/api/users", "delete": "/api/users/{id}"},
]


def _request(method: str, path: str) -> dict | list | None:
    req = urllib.request.Request(BASE_URL + path, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read()
            return json.loads(body) if body else None
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def find_tagged(entity: dict, tag: str) -> list[dict]:
    items = _request("GET", entity["list"]) or []
    return [item for item in items if tag in json.dumps(item)]


def delete_one(entity: dict, item_id) -> None:
    path = entity["delete"].format(id=item_id)
    _request("DELETE", path)


def cleanup(tag: str) -> None:
    if not ENTITY_ENDPOINTS:
        print(
            "ENTITY_ENDPOINTS is empty — adapt this script to the project's "
            "entities before running it for real.",
            file=sys.stderr,
        )
        return

    total_deleted = 0
    for entity in ENTITY_ENDPOINTS:
        rows = find_tagged(entity, tag)
        for row in rows:
            delete_one(entity, row["id"])
            total_deleted += 1
        print(f"{entity['name']}: deleted {len(rows)} row(s) tagged '{tag}'")

    print(f"Done. {total_deleted} row(s) deleted total. "
          f"Nothing found is success, not failure.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "tag",
        nargs="?",
        help="run_id or prefix that tagged this run's test data (e.g. 'test_' or a UUID)",
    )
    args = parser.parse_args()

    if not args.tag:
        parser.print_help()
        return 1

    cleanup(args.tag)
    return 0


if __name__ == "__main__":
    sys.exit(main())
