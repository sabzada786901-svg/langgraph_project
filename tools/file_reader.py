"""
File tools.

Both tools below are sandboxed to `ALLOWED_FILES_DIR` (data/knowledge/ by
default). Filenames are resolved with os.path.realpath and checked against
the allowed directory so that ".." path-traversal tricks cannot escape it.

`delete_local_file` is intentionally irreversible and destructive, which is
why it is treated as a SENSITIVE tool: the agent graph pauses for human
approval before it is ever actually executed (see agent/nodes.py).
"""

import os

from langchain_core.tools import tool

from utils.config import ALLOWED_FILES_DIR

_MAX_READ_CHARS = 4000


def _resolve_safe_path(filename: str) -> tuple[str | None, str | None]:
    """Resolve `filename` inside ALLOWED_FILES_DIR.

    Returns (path, error). If error is not None, path is None and the
    error message should be returned to the caller as-is.
    """
    filename = (filename or "").strip().replace("\\", "/")

    if not filename:
        return None, "Error: no filename was provided."
    if ".." in filename or filename.startswith("/") or ":" in filename:
        return None, "Error: invalid filename. Path traversal is not allowed."

    base_dir = os.path.realpath(ALLOWED_FILES_DIR)
    target_path = os.path.realpath(os.path.join(base_dir, filename))

    if target_path != base_dir and not target_path.startswith(base_dir + os.sep):
        return None, "Error: access denied. That file is outside the allowed directory."

    return target_path, None


@tool
def read_local_file(filename: str) -> str:
    """Read the text contents of a file inside the project's allowed
    data/knowledge directory.

    Only a plain filename (e.g. "sample.txt") is accepted -- absolute paths
    and ".." path traversal are rejected. Long files are truncated.
    """
    target_path, error = _resolve_safe_path(filename)
    if error:
        return error

    if not os.path.isfile(target_path):
        return f"Error: file '{filename}' was not found in the allowed directory."

    try:
        with open(target_path, "r", encoding="utf-8") as f:
            content = f.read()
    except PermissionError:
        return f"Error: permission denied when reading '{filename}'."
    except UnicodeDecodeError:
        return f"Error: '{filename}' does not look like a readable text file."
    except OSError as exc:
        return f"Error: could not read '{filename}' ({exc})."

    if len(content) > _MAX_READ_CHARS:
        content = content[:_MAX_READ_CHARS] + "\n... [truncated]"

    return content


@tool
def delete_local_file(filename: str) -> str:
    """Permanently delete a file inside the project's allowed
    data/knowledge directory.

    This is a SENSITIVE, IRREVERSIBLE operation. The agent graph will pause
    and ask a human to approve or reject this action before it is actually
    executed -- this function only runs after approval is granted.
    """
    target_path, error = _resolve_safe_path(filename)
    if error:
        return error

    if not os.path.isfile(target_path):
        return f"Error: file '{filename}' was not found in the allowed directory."

    try:
        os.remove(target_path)
    except PermissionError:
        return f"Error: permission denied when deleting '{filename}'."
    except OSError as exc:
        return f"Error: could not delete '{filename}' ({exc})."

    return f"'{filename}' has been permanently deleted."
