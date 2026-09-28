from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent.graph import build_graph
from langgraph.types import Command


app = FastAPI(title="LangGraph AI Agent API")


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Build graph ONCE
# ---------------------------------------------------------

graph = build_graph()


# ---------------------------------------------------------
# Request models
# ---------------------------------------------------------

class ChatRequest(BaseModel):
    thread_id: str
    message: str
    files: list[Any] = []
    provider: str = "groq"
    model: str | None = None
    temperature: float = 0.7
    language: str = "English"


class ApprovalRequest(BaseModel):
    thread_id: str
    approval_id: str
    decision: str


# ---------------------------------------------------------
# Health check
# ---------------------------------------------------------

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "LangGraph AI Agent API is running"
    }


# ---------------------------------------------------------
# Chat
# ---------------------------------------------------------

@app.post("/api/chat")
async def chat(request: ChatRequest):

    try:

        result = graph.invoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": request.message
                    }
                ]
            },
            config={
                "configurable": {
                    "thread_id": request.thread_id
                }
            }
        )

        # -------------------------------------------------
        # Human approval interrupt
        # -------------------------------------------------

        if result.get("__interrupt__"):

            interrupt_obj = result["__interrupt__"][0]
            payload = interrupt_obj.value

            return {
                "thread_id": request.thread_id,
                "message": "",
                "status": "waiting_for_approval",
                "approval_request": {
                    "id": request.thread_id,
                    "message": payload.get(
                        "message",
                        "The agent needs your approval."
                    ),
                    "pending_tool_calls": payload.get(
                        "pending_tool_calls",
                        []
                    ),
                },
            }

        # -------------------------------------------------
        # Normal response
        # -------------------------------------------------

        messages = result.get("messages", [])

        if not messages:
            return {
                "thread_id": request.thread_id,
                "message": "",
                "status": "completed",
            }

        last_message = messages[-1]

        content = last_message.content

        return {
            "thread_id": request.thread_id,
            "message": content,
            "status": "completed",
        }

    except Exception as exc:

        return {
            "thread_id": request.thread_id,
            "message": f"Error: {str(exc)}",
            "status": "error",
        }


# ---------------------------------------------------------
# Human approval
# ---------------------------------------------------------

@app.post("/api/chat/approval")
async def approve_action(request: ApprovalRequest):

    try:

        decision = request.decision.lower()

        approved = decision in (
            "approve",
            "approved",
            "yes",
            "y",
        )

        result = graph.invoke(
            Command(
                resume={
                    "approved": approved
                }
            ),
            config={
                "configurable": {
                    "thread_id": request.thread_id
                }
            },
        )

        # If another interrupt happens
        if result.get("__interrupt__"):

            interrupt_obj = result["__interrupt__"][0]
            payload = interrupt_obj.value

            return {
                "thread_id": request.thread_id,
                "message": "",
                "status": "waiting_for_approval",
                "approval_request": {
                    "id": request.thread_id,
                    "message": payload.get(
                        "message",
                        "The agent needs your approval."
                    ),
                    "pending_tool_calls": payload.get(
                        "pending_tool_calls",
                        []
                    ),
                },
            }

        messages = result.get("messages", [])

        if not messages:
            return {
                "thread_id": request.thread_id,
                "message": "",
                "status": "completed",
            }

        return {
            "thread_id": request.thread_id,
            "message": messages[-1].content,
            "status": "completed",
        }

    except Exception as exc:

        return {
            "thread_id": request.thread_id,
            "message": f"Approval error: {str(exc)}",
            "status": "error",
        }