"""
Sample Python Tool / MCP Plugin
Can be dynamically executed by the FastAPI orchestrator.
"""

import platform
import psutil

def get_system_diagnostics():
    return {
        "os": platform.system(),
        "release": platform.release(),
        "architecture": platform.machine(),
        "cpu_count": psutil.cpu_count(logical=True),
        "memory_percent": psutil.virtual_memory().percent
    }

if __name__ == "__main__":
    print(get_system_diagnostics())
