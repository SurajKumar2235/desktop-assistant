"""
FastAPI Backend for 3D AI Desktop Assistant
Handles LLM Orchestration, MCP/Tool Execution, and Configuration.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import json
import os

app = FastAPI(title="AI Assistant Backend", version="1.0.0")

# Enable CORS for Electron renderer
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONFIG_FILE = "config.json"
MCP_CONFIG_FILE = "mcp_config.json"

class ChatRequest(BaseModel):
    prompt: str
    stream: Optional[bool] = False
    model: Optional[str] = "default"

class ChatResponse(BaseModel):
    response: str
    status: str
    tool_calls: Optional[List[Dict[str, Any]]] = None

class SettingsUpdate(BaseModel):
    llm_provider: Optional[str] = "openai"
    model: Optional[str] = "gpt-4o"
    api_key: Optional[str] = ""
    temperature: Optional[float] = 0.7

# Sample tools registry (MCP-ready)
TOOLS = [
    {
        "name": "system_info",
        "description": "Returns current OS, CPU and memory information",
        "enabled": True
    },
    {
        "name": "web_search",
        "description": "Searches the web for latest data",
        "enabled": False
    },
    {
        "name": "file_reader",
        "description": "Reads contents of local project files",
        "enabled": True
    }
]

@app.get("/")
def read_root():
    return {"name": "AI Assistant Backend", "status": "online"}

@app.get("/api/status")
def get_status():
    return {
        "status": "active",
        "tools_active": sum(1 for t in TOOLS if t["enabled"]),
        "version": "1.0.0"
    }

@app.get("/api/tools")
def list_tools():
    return {"tools": TOOLS}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    prompt = request.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    # In production, this forwards to OpenAI, Ollama, Anthropic or local model
    # Here we demonstrate reactive intelligent routing
    lower_prompt = prompt.lower()

    if "tool" in lower_prompt or "capability" in lower_prompt:
        active = [t["name"] for t in TOOLS if t["enabled"]]
        reply = f"Currently active capabilities: {', '.join(active)}. You can customize these in mcp_config.json."
    elif "status" in lower_prompt or "health" in lower_prompt:
        reply = "FastAPI backend is operational at 100% capacity. Ready to execute LLM workflows."
    else:
        reply = f"Processed through FastAPI backend: '{prompt}'. Ready for tool invocation and LLM inference."

    return ChatResponse(
        response=reply,
        status="success",
        tool_calls=[]
    )

@app.post("/api/settings")
def update_settings(settings: SettingsUpdate):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(settings.dict(), f, indent=2)
        return {"status": "saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
