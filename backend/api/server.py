import asyncio
import json
from typing import List, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.models.schemas import MatchEvent, MatchStateSnapshot
from backend.simulator.match_generator import SyntheticMatchSimulator
from backend.simulator.rosters import get_premier_league_teams
from backend.agents.multi_agent_system import AgentOrchestrator

app = FastAPI(
    title="Inside the Game: AI Match Intelligence Platform API",
    description="Transforms synthetic football events into explainable match intelligence, multi-agent commentary, and personalized broadcast overlays.",
    version="1.0.0",
)

import os
from fastapi.staticfiles import StaticFiles

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")


# Global simulation state
simulator = SyntheticMatchSimulator()
orchestrator = AgentOrchestrator()
active_connections: List[WebSocket] = []
cached_events: List[MatchEvent] = []


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Inside The Game - Premier League Match Intelligence API",
        "version": "1.0.0",
        "hero_technologies": ["Microsoft AI Foundry", "Agent Framework", "Azure Cloud Native", "WebSockets"],
    }


@app.get("/api/match/teams")
async def get_teams():
    home, away = get_premier_league_teams()
    return {
        "home_team": home.model_dump(),
        "away_team": away.model_dump(),
    }


@app.post("/api/match/reset")
async def reset_match():
    global simulator, orchestrator, cached_events
    simulator = SyntheticMatchSimulator()
    orchestrator = AgentOrchestrator()
    cached_events = []
    return {"status": "reset_successful", "match_id": simulator.match_id}


@app.get("/api/match/recap")
async def get_match_recap():
    global simulator, orchestrator, cached_events
    if not cached_events:
        # Generate some events if none exist
        cached_events = simulator.generate_full_match_stream(60)
    final_event = cached_events[-1]
    recap = orchestrator.get_full_match_recap(final_event, cached_events)
    return recap


@app.websocket("/ws/match-stream")
async def match_stream_websocket(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        # Stream events live
        while True:
            event = simulator.step_event()
            cached_events.append(event)
            insights = orchestrator.dispatch(event)

            payload = {
                "type": "match_update",
                "event": event.model_dump(),
                "insights": [i.model_dump() for i in insights],
                "score": {
                    "home": simulator.home_score,
                    "away": simulator.away_score,
                },
                "clock": {
                    "minute": event.minute,
                    "second": event.second,
                    "phase": event.match_phase,
                },
            }

            await websocket.send_text(json.dumps(payload))
            # 1.2s delay between match updates for responsive visualization
            await asyncio.sleep(1.2)

    except WebSocketDisconnect:
        active_connections.remove(websocket)
    except Exception as e:
        if websocket in active_connections:
            active_connections.remove(websocket)


if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api.server:app", host="0.0.0.0", port=8000, reload=True)
