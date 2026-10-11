import asyncio
import json
import os
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.models.schemas import MatchEvent, MatchStateSnapshot
from backend.simulator.match_generator import SyntheticMatchSimulator
from backend.simulator.rosters import get_premier_league_teams
from backend.agents.multi_agent_system import AgentOrchestrator


class MatchBroadcastManager:
    """
    Centralized broadcast manager providing single-source-of-truth match streaming.
    Ensures all connected WebSocket clients receive synchronized events and can reconnect seamlessly.
    """

    def __init__(self, max_buffer_size: int = 500):
        self.simulator = SyntheticMatchSimulator()
        self.orchestrator = AgentOrchestrator()
        self.active_connections: Set[WebSocket] = set()
        self.cached_events: List[MatchEvent] = []
        self.max_buffer_size = max_buffer_size
        self.is_running = True
        self.broadcast_task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

        # Send initial sync payload with recent history replay
        init_payload = {
            "type": "initial_sync",
            "score": {
                "home": self.simulator.home_score,
                "away": self.simulator.away_score,
            },
            "clock": {
                "minute": int(self.simulator.current_time_s // 60),
                "second": int(self.simulator.current_time_s % 60),
                "current_time_s": self.simulator.current_time_s,
            },
            "recent_events": [e.model_dump() for e in self.cached_events[-30:]],
            "recent_insights": [i.model_dump() for i in self.orchestrator.shared_blackboard[-20:]],
        }
        await websocket.send_text(json.dumps(init_payload))

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast_event(self, event: MatchEvent, insights: list):
        if len(self.cached_events) >= self.max_buffer_size:
            # Evict oldest 100 events to maintain memory bounds
            self.cached_events = self.cached_events[-350:]

        self.cached_events.append(event)

        payload = json.dumps({
            "type": "match_update",
            "event": event.model_dump(),
            "insights": [i.model_dump() for i in insights],
            "score": {
                "home": self.simulator.home_score,
                "away": self.simulator.away_score,
            },
            "clock": {
                "minute": event.minute,
                "second": event.second,
                "phase": event.match_phase,
                "timestamp_s": event.timestamp_s,
            },
        })

        # Broadcast to all connected clients
        stale_connections = []
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception:
                stale_connections.append(connection)

        for stale in stale_connections:
            self.disconnect(stale)

    async def run_loop(self):
        """Single centralized background match progression loop."""
        while self.is_running:
            try:
                event = self.simulator.step_event()
                insights = self.orchestrator.dispatch(event)
                await self.broadcast_event(event, insights)
            except Exception as e:
                print(f"Error in broadcast loop: {e}")
            await asyncio.sleep(1.2)

    def reset(self):
        self.simulator = SyntheticMatchSimulator()
        self.orchestrator = AgentOrchestrator()
        self.cached_events.clear()


manager = MatchBroadcastManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start centralized broadcast runner
    manager.broadcast_task = asyncio.create_task(manager.run_loop())
    yield
    # Cleanup on shutdown
    manager.is_running = False
    if manager.broadcast_task:
        manager.broadcast_task.cancel()


app = FastAPI(
    title="Inside the Game: AI Match Intelligence Platform API",
    description="Transforms synthetic football events into explainable match intelligence, multi-agent commentary, and personalized broadcast overlays.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Inside The Game - Premier League Match Intelligence API",
        "version": "1.0.0",
        "active_clients": len(manager.active_connections),
        "total_buffered_events": len(manager.cached_events),
        "hero_technologies": ["Microsoft AI Foundry", "Agent Framework", "Azure Cloud Native", "WebSockets"],
    }


@app.get("/api/match/teams")
async def get_teams():
    home, away = get_premier_league_teams()
    return {
        "home_team": home.model_dump(),
        "away_team": away.model_dump(),
    }


@app.get("/api/match/status")
async def get_match_status():
    minute = int(manager.simulator.current_time_s // 60)
    second = int(manager.simulator.current_time_s % 60)
    return {
        "match_id": manager.simulator.match_id,
        "score": {
            "home": manager.simulator.home_score,
            "away": manager.simulator.away_score,
        },
        "clock": {
            "minute": minute,
            "second": second,
            "timestamp_s": manager.simulator.current_time_s,
        },
        "total_events": len(manager.cached_events),
    }


@app.get("/api/match/events")
async def get_match_events(limit: int = 50):
    events = manager.cached_events[-limit:]
    return {
        "total": len(manager.cached_events),
        "returned": len(events),
        "events": [e.model_dump() for e in events],
    }


@app.post("/api/match/reset")
async def reset_match():
    manager.reset()
    return {"status": "reset_successful", "match_id": manager.simulator.match_id}


@app.get("/api/match/recap")
async def get_match_recap():
    if not manager.cached_events:
        manager.cached_events = manager.simulator.generate_full_match_stream(60)
    final_event = manager.cached_events[-1]
    recap = manager.orchestrator.get_full_match_recap(final_event, manager.cached_events)
    return recap


@app.websocket("/ws/match-stream")
async def match_stream_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Keep client connection open to receive broadcast messages
        while True:
            # Client can optionally send ping or pause/play commands
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api.server:app", host="0.0.0.0", port=8000, reload=True)
