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
        self.is_paused = False
        self.speed_multiplier = 1.0
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
            "is_paused": self.is_paused,
            "speed_multiplier": self.speed_multiplier,
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
            "is_paused": self.is_paused,
            "speed_multiplier": self.speed_multiplier,
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
            if not self.is_paused:
                try:
                    event = self.simulator.step_event()
                    insights = self.orchestrator.dispatch(event)
                    await self.broadcast_event(event, insights)
                except Exception as e:
                    print(f"Error in broadcast loop: {e}")
            delay = max(0.2, 1.2 / max(0.1, self.speed_multiplier))
            await asyncio.sleep(delay)

    def reset(self):
        self.simulator = SyntheticMatchSimulator()
        self.orchestrator = AgentOrchestrator()
        self.cached_events.clear()
        self.is_paused = False
        self.speed_multiplier = 1.0


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
        "is_paused": manager.is_paused,
        "speed_multiplier": manager.speed_multiplier,
        "total_events": len(manager.cached_events),
    }


@app.post("/api/match/pause")
async def pause_match():
    manager.is_paused = True
    return {"status": "paused", "is_paused": manager.is_paused}


@app.post("/api/match/resume")
async def resume_match():
    manager.is_paused = False
    return {"status": "resumed", "is_paused": manager.is_paused}


@app.post("/api/match/speed")
async def set_speed(speed: float = 1.0):
    manager.speed_multiplier = max(0.25, min(5.0, speed))
    return {"status": "speed_updated", "speed_multiplier": manager.speed_multiplier}


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
            text = await websocket.receive_text()
            try:
                cmd = json.loads(text)
                action = cmd.get("action")
                if action == "pause":
                    manager.is_paused = True
                elif action == "resume":
                    manager.is_paused = False
                elif action == "speed":
                    manager.speed_multiplier = max(0.25, min(5.0, float(cmd.get("value", 1.0))))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api.server:app", host="0.0.0.0", port=8000, reload=True)
