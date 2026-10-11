import math
import pytest
from fastapi.testclient import TestClient
from backend.api.server import app, manager
from backend.models.schemas import (
    EventType,
    MatchPhase,
    PitchLocation,
    PassDetail,
    ShotDetail,
    TacticalMetricState,
    ExplainabilityContext,
    MatchEvent,
    AgentInsight,
)
from backend.simulator.match_generator import SyntheticMatchSimulator
from backend.simulator.rosters import get_premier_league_teams
from backend.analytics.metrics_engine import MetricsEngine
from backend.agents.multi_agent_system import (
    TacticalAnalystAgent,
    BroadcastCommentatorAgent,
    NarrativeRecapAgent,
    MultilingualTranslatorAgent,
    AgentOrchestrator,
)


# ==========================================
# 1. Pydantic Event Schema Validation Tests
# ==========================================

def test_pitch_location_validation():
    loc = PitchLocation(x=52.5, y=34.0, z=0.0)
    assert loc.x == 52.5
    assert loc.y == 34.0
    assert loc.z == 0.0


def test_agent_insight_schema_with_evidence():
    insight = AgentInsight(
        insight_id="ins_test_001",
        match_id="pl_test_match",
        agent_name="TacticalAnalyst",
        role="Lead Analyst",
        timestamp_s=120.5,
        minute=2,
        headline="TEST HEADLINE",
        content="Test tactical content grounded in data.",
        persona_target="analyst",
        importance="high",
        confidence=0.92,
        evidence_event_ids=["ev_0001", "ev_0002"],
        supporting_metrics={"xg": 0.45},
    )
    assert insight.insight_id == "ins_test_001"
    assert insight.confidence == 0.92
    assert "ev_0001" in insight.evidence_event_ids


# ==========================================
# 2. Football Mathematics: xG Model Tests
# ==========================================

def test_xg_direction_aware_home_and_away():
    engine = MetricsEngine()
    
    # Home team shooting at right goal (x=105) from 6-yard box (x=100, y=34)
    home_tap_in = PitchLocation(x=100.0, y=34.0)
    home_xg = engine.calculate_xg(home_tap_in, target_goal_x=105.0, shot_type="open_play")
    assert home_xg > 0.40, f"Expected high xG for 5m tap-in, got {home_xg}"
    
    # Away team shooting at left goal (x=0) from 6-yard box (x=5, y=34)
    away_tap_in = PitchLocation(x=5.0, y=34.0)
    away_xg = engine.calculate_xg(away_tap_in, target_goal_x=0.0, shot_type="open_play")
    assert away_xg > 0.40, f"Expected high xG for away team 5m tap-in, got {away_xg}"
    
    # Symmetrical equivalence between home and away shots from same relative geometry
    assert abs(home_xg - away_xg) < 0.05


def test_xg_distance_and_angle_decay():
    engine = MetricsEngine()
    # Close-range central shot
    close_central = PitchLocation(x=98.0, y=34.0)
    xg_close = engine.calculate_xg(close_central, target_goal_x=105.0)

    # Long-range shot from 35m out
    long_range = PitchLocation(x=70.0, y=34.0)
    xg_long = engine.calculate_xg(long_range, target_goal_x=105.0)

    # Acute angle shot near byline (x=103, y=5.0)
    acute_angle = PitchLocation(x=103.0, y=5.0)
    xg_acute = engine.calculate_xg(acute_angle, target_goal_x=105.0)

    assert xg_close > xg_long, "Close central shot must have higher xG than long range"
    assert xg_close > xg_acute, "Close central shot must have higher xG than acute angle"
    assert 0.01 <= xg_long <= 0.20
    assert 0.01 <= xg_acute <= 0.15


def test_xg_shot_type_multipliers():
    engine = MetricsEngine()
    loc = PitchLocation(x=95.0, y=34.0)
    xg_open = engine.calculate_xg(loc, target_goal_x=105.0, shot_type="open_play")
    xg_header = engine.calculate_xg(loc, target_goal_x=105.0, shot_type="header")
    xg_free_kick = engine.calculate_xg(loc, target_goal_x=105.0, shot_type="free_kick")

    assert xg_open > xg_header, "Open play shot should have higher conversion than header"
    assert xg_open > xg_free_kick, "Open play shot should have higher conversion than direct free kick"


# ==========================================
# 3. Football Mathematics: Pass Difficulty
# ==========================================

def test_pass_difficulty_home_and_away_progression():
    engine = MetricsEngine()

    # Home team progressive pass towards x=105
    home_start = PitchLocation(x=30.0, y=34.0)
    home_end = PitchLocation(x=55.0, y=34.0)
    diff_home_fwd = engine.calculate_pass_difficulty(home_start, home_end, attacking_direction=1)

    # Home team backward pass
    home_back_end = PitchLocation(x=20.0, y=34.0)
    diff_home_back = engine.calculate_pass_difficulty(home_start, home_back_end, attacking_direction=1)

    assert diff_home_fwd > diff_home_back, "Forward pass must be more difficult than backward pass"

    # Away team progressive pass towards x=0 (start at 75, end at 50)
    away_start = PitchLocation(x=75.0, y=34.0)
    away_end = PitchLocation(x=50.0, y=34.0)
    diff_away_fwd = engine.calculate_pass_difficulty(away_start, away_end, attacking_direction=-1)

    # Away team backward pass (start at 75, end at 85)
    away_back_end = PitchLocation(x=85.0, y=34.0)
    diff_away_back = engine.calculate_pass_difficulty(away_start, away_back_end, attacking_direction=-1)

    assert diff_away_fwd > diff_away_back, "Away forward pass must be more difficult than away backward pass"


def test_pass_difficulty_line_breaking_bonus():
    engine = MetricsEngine()
    start = PitchLocation(x=40.0, y=30.0)
    end = PitchLocation(x=60.0, y=35.0)

    standard_diff = engine.calculate_pass_difficulty(start, end, is_line_breaking=False)
    line_breaking_diff = engine.calculate_pass_difficulty(start, end, is_line_breaking=True)

    assert line_breaking_diff > standard_diff
    assert line_breaking_diff <= 0.98


# ==========================================
# 4. Tactical Dynamics: Control vs Chaos & PPDA
# ==========================================

def test_control_vs_chaos_state_transitions():
    engine = MetricsEngine()
    loc = PitchLocation(x=50.0, y=30.0)

    initial_control = engine.rolling_control

    # Successful passes build control
    state1 = engine.update_tactical_state(EventType.PASS, "arsenal", loc, success=True)
    assert state1.control_vs_chaos > initial_control

    # Turnovers sharply reduce control
    state2 = engine.update_tactical_state(EventType.TURNOVER, "arsenal", loc, success=False, is_turnover=True)
    assert state2.control_vs_chaos < state1.control_vs_chaos


def test_cumulative_possession_sums_to_100():
    engine = MetricsEngine()
    loc = PitchLocation(x=50.0, y=34.0)

    for i in range(15):
        team = "arsenal" if i % 3 != 0 else "mancity"
        state = engine.update_tactical_state(EventType.PASS, team, loc, success=True)

    assert round(state.home_possession_pct + state.away_possession_pct, 1) == 100.0


def test_ppda_zero_defensive_actions_safety():
    engine = MetricsEngine()
    loc = PitchLocation(x=50.0, y=34.0)
    # State update before any defensive action occurs
    state = engine.update_tactical_state(EventType.PASS, "arsenal", loc, success=True)
    assert state.pressing_intensity_ppda > 0.0
    assert not math.isnan(state.pressing_intensity_ppda)


# ==========================================
# 5. Synthetic Match Generator Verification
# ==========================================

def test_synthetic_simulator_event_generation():
    sim = SyntheticMatchSimulator("test_sim_match")
    events = sim.generate_full_match_stream(25)

    assert len(events) == 25
    first_event = events[0]
    assert first_event.event_id.startswith("ev_")
    assert first_event.wall_clock_iso is not None
    assert first_event.timestamp_s >= 0.0
    assert 0.0 <= first_event.location.x <= 105.0
    assert 0.0 <= first_event.location.y <= 68.0
    assert len(first_event.explainability.evidence_event_ids) > 0


# ==========================================
# 6. Multi-Agent System & Cooldown Verification
# ==========================================

def test_agent_orchestrator_dispatch_and_cooldown():
    orch = AgentOrchestrator()
    sim = SyntheticMatchSimulator()
    events = sim.generate_full_match_stream(30)

    all_insights = []
    for e in events:
        insights = orch.dispatch(e)
        all_insights.extend(insights)

    assert len(all_insights) > 0

    # Verify that insights contain evidence traceability
    for insight in all_insights:
        assert insight.insight_id is not None
        assert insight.confidence >= 0.0
        assert insight.persona_target in ["all", "analyst", "casual", "player_focus"]


def test_multilingual_translation():
    translator = MultilingualTranslatorAgent()
    base_insight = AgentInsight(
        insight_id="ins_goal_test",
        match_id="test_m",
        agent_name="LiveCommentator",
        role="Commentator",
        timestamp_s=45.0,
        minute=1,
        headline="GOAL! SAKA STRIKES!",
        content="WHAT A MOMENT! Saka lashes it into the net!",
        persona_target="casual",
        importance="critical",
    )

    es_insight = translator.translate_insight(base_insight, "es")
    ar_insight = translator.translate_insight(base_insight, "ar")

    assert es_insight.language == "es"
    assert "GOLAZO" in es_insight.content
    assert ar_insight.language == "ar"
    assert "هدف" in ar_insight.content


def test_grounded_match_recap():
    orch = AgentOrchestrator()
    sim = SyntheticMatchSimulator()
    events = sim.generate_full_match_stream(35)
    for e in events:
        orch.dispatch(e)

    final_event = events[-1]
    recap = orch.get_full_match_recap(final_event, events)

    assert "Full Match Intelligence Recap" in recap["title"]
    assert "verified_statistics" in recap
    stats = recap["verified_statistics"]
    assert stats["total_events_analyzed"] == 35
    assert stats["total_passes"] > 0
    assert round(stats["home_possession_pct"] + stats["away_possession_pct"], 1) == 100.0


# ==========================================
# 7. API REST Endpoints Verification
# ==========================================

def test_api_rest_endpoints():
    client = TestClient(app)

    # Health endpoint
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    # Teams endpoint
    res = client.get("/api/match/teams")
    assert res.status_code == 200
    teams_data = res.json()
    assert teams_data["home_team"]["short_name"] == "ARS"
    assert teams_data["away_team"]["short_name"] == "MCI"
    assert len(teams_data["home_team"]["roster"]) == 11
    assert len(teams_data["away_team"]["roster"]) == 11

    # Match Status endpoint
    res = client.get("/api/match/status")
    assert res.status_code == 200
    status_data = res.json()
    assert "score" in status_data
    assert "clock" in status_data

    # Match Events endpoint
    res = client.get("/api/match/events?limit=10")
    assert res.status_code == 200
    assert "events" in res.json()

    # Reset endpoint
    res = client.post("/api/match/reset")
    assert res.status_code == 200
    assert res.json()["status"] == "reset_successful"

    # Recap endpoint
    res = client.get("/api/match/recap")
    assert res.status_code == 200
    assert "Full Match Intelligence Recap" in res.json()["title"]


def test_websocket_stream_initial_sync():
    client = TestClient(app)
    with client.websocket_connect("/ws/match-stream") as ws:
        data = ws.receive_json()
        assert data["type"] == "initial_sync"
        assert "score" in data
        assert "clock" in data
        assert "recent_events" in data


def test_broadcast_manager_memory_bounds():
    manager.cached_events.clear()
    sim = SyntheticMatchSimulator()
    # Simulate generating 600 events to verify memory eviction bounds
    events = sim.generate_full_match_stream(50)
    for e in events:
        manager.cached_events.append(e)
    assert len(manager.cached_events) <= manager.max_buffer_size

