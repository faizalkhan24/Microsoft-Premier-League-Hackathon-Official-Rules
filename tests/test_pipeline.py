import pytest
from fastapi.testclient import TestClient
from backend.api.server import app
from backend.simulator.match_generator import SyntheticMatchSimulator
from backend.analytics.metrics_engine import MetricsEngine
from backend.agents.multi_agent_system import AgentOrchestrator


def test_metrics_engine():
    engine = MetricsEngine()
    # Test distance calculation
    from backend.models.schemas import PitchLocation
    loc1 = PitchLocation(x=0.0, y=0.0)
    loc2 = PitchLocation(x=3.0, y=4.0)
    assert engine.calculate_distance(loc1, loc2) == 5.0

    # Test xG calculation
    shot_loc = PitchLocation(x=95.0, y=34.0)
    xg = engine.calculate_xg(shot_loc)
    assert 0.01 <= xg <= 1.0


def test_synthetic_match_simulator():
    sim = SyntheticMatchSimulator()
    events = sim.generate_full_match_stream(20)
    assert len(events) == 20
    assert events[0].event_id.startswith("ev_")
    assert events[0].tactical_metrics.control_vs_chaos >= 0.0


def test_multi_agent_system():
    sim = SyntheticMatchSimulator()
    orch = AgentOrchestrator()
    events = sim.generate_full_match_stream(10)
    insights = []
    for e in events:
        insights.extend(orch.dispatch(e))
    assert len(insights) > 0


def test_api_endpoints():
    client = TestClient(app)
    # Health check
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    # Teams endpoint
    res = client.get("/api/match/teams")
    assert res.status_code == 200
    data = res.json()
    assert data["home_team"]["short_name"] == "ARS"
    assert data["away_team"]["short_name"] == "MCI"

    # Recap endpoint
    res = client.get("/api/match/recap")
    assert res.status_code == 200
    assert "Full Match Intelligence Recap" in res.json()["title"]
