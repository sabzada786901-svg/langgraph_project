"""
Calculator tool.

Evaluates basic arithmetic expressions WITHOUT using eval()/exec(). Only a
small, explicit set of numeric operators is permitted; anything else (names,
function calls, attribute access, imports, etc.) is rejected before it can
ever be evaluated.
"""

import ast
import operator

from langchain_core.tools import tool

# Only these AST operator node types are allowed to be evaluated.
_ALLOWED_BINARY_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}

_ALLOWED_UNARY_OPERATORS = {
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

_MAX_EXPRESSION_LENGTH = 200


def _eval_node(node: ast.AST):
    """Recursively evaluate a restricted subset of a Python expression AST."""
    if isinstance(node, ast.Constant):
        if isinstance(node.value, bool) or not isinstance(node.value, (int, float)):
            raise ValueError("Only numeric constants are allowed.")
        return node.value

    if isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type not in _ALLOWED_BINARY_OPERATORS:
            raise ValueError(f"Operator '{op_type.__name__}' is not allowed.")
        left = _eval_node(node.left)
        right = _eval_node(node.right)
        if op_type is ast.Pow and (abs(right) > 1000 or abs(left) > 1000):
            # Guard against absurdly expensive exponentiation.
            raise ValueError("Exponent or base is too large.")
        return _ALLOWED_BINARY_OPERATORS[op_type](left, right)

    if isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type not in _ALLOWED_UNARY_OPERATORS:
            raise ValueError(f"Operator '{op_type.__name__}' is not allowed.")
        return _ALLOWED_UNARY_OPERATORS[op_type](_eval_node(node.operand))

    raise ValueError(f"Unsupported expression element: '{type(node).__name__}'.")


def safe_eval(expression: str) -> float:
    """Safely evaluate a numeric expression string. Raises ValueError on
    anything that is not a plain arithmetic expression."""
    if len(expression) > _MAX_EXPRESSION_LENGTH:
        raise ValueError("Expression is too long.")
    try:
        parsed = ast.parse(expression, mode="eval")
    except SyntaxError as exc:
        raise ValueError(f"Invalid expression syntax ({exc.msg}).") from exc
    return _eval_node(parsed.body)


@tool
def calculator(expression: str) -> str:
    """Evaluate a basic arithmetic expression and return the result.

    Supports +, -, *, /, // (floor division), % (modulo), ** (power),
    parentheses, and unary +/-. Does NOT support variables, function calls,
    or any kind of code execution.

    Example inputs: "125 * 8", "(3 + 4) / 2", "-7 % 3".
    """
    expression = (expression or "").strip()
    if not expression:
        return "Error: the expression was empty."

    try:
        result = safe_eval(expression)
    except ZeroDivisionError:
        return "Error: division by zero."
    except ValueError as exc:
        return f"Error: {exc}"
    except Exception as exc:  # pragma: no cover - final safety net
        return f"Error: could not evaluate the expression ({exc})."

    return f"{expression} = {result}"
