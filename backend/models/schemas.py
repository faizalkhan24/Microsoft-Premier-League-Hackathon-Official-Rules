from __future__ import annotations
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class EventType(str, Enum):
    PASS = "pass"
    SHOT = "shot"
    GOAL = "goal"
    TACKLE = "tackle"
    INTERCEPTION = "interception"
    PRESSURE = "pressure"
    TURNOVER = "turnover"
    FOUL = "foul"
    SAVE = "save"
    CLEARANCE = "clearance"
    CARRY = "carry"


class MatchPhase(str, Enum):
    FIRST_HALF = "1H"
    HALF_TIME = "HT"
    SECOND_HALF = "2H"
    FULL_TIME = "FT"


class PitchLocation(BaseModel):
    x: float = Field(..., description="Pitch X coordinate in meters [0.0, 105.0] (0 = left goal line, 105 = right goal line)")
    y: float = Field(..., description="Pitch Y coordinate in meters [0.0, 68.0] (0 = top sideline, 68 = bottom sideline)")
    z: float = Field(default=0.0, description="Ball height in meters [0.0, 10.0]")


class Player(BaseModel):
    id: str
    name: str
    number: int
    team_id: str
    position: str  # GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST
    speed_mps: float = 0.0  # Current speed in meters/second
    distance_covered_m: float = 0.0  # Cumulative distance in meters
    stamina_pct: float = 100.0


class Team(BaseModel):
    id: str
    name: str
    short_name: str
    primary_color: str
    secondary_color: str
    formation: str
    attacking_direction: int = Field(default=1, description="1 if attacking towards x=105 (Home), -1 if towards x=0 (Away)")
    roster: List[Player] = []


class PassDetail(BaseModel):
    recipient_id: Optional[str] = None
    recipient_name: Optional[str] = None
    start_location: PitchLocation
    end_location: PitchLocation
    distance_m: float
    difficulty_rating: float = Field(..., description="Pass difficulty index [0.05, 0.98]: 0.05=routine sideways pass, 0.98=extreme line-breaking long pass")
    success: bool
    is_line_breaking: bool = False
    speed_kmh: float = 0.0


class ShotDetail(BaseModel):
    shot_type: str = Field(..., description="open_play, free_kick, header, volley, penalty")
    location: PitchLocation
    target_location: PitchLocation
    xg: float = Field(..., description="Expected Goals heuristic estimate [0.01, 0.99]")
    shot_speed_kmh: float = Field(..., description="Shot exit velocity in km/h")
    on_target: bool
    is_goal: bool


class TacticalMetricState(BaseModel):
    control_vs_chaos: float = Field(..., description="Heuristic scale 0-100: 0=extreme turnover flux/chaos, 100=sustained possession control")
    home_momentum: float = Field(..., description="0-100% tactical momentum share for home team")
    away_momentum: float = Field(..., description="0-100% tactical momentum share for away team")
    home_possession_pct: float = Field(default=50.0, description="Cumulative possession percentage for home team")
    away_possession_pct: float = Field(default=50.0, description="Cumulative possession percentage for away team")
    home_xg_cumulative: float = Field(default=0.0, description="Cumulative xG for home team")
    away_xg_cumulative: float = Field(default=0.0, description="Cumulative xG for away team")
    pressing_intensity_ppda: float = Field(..., description="Passes Allowed Per Defensive Action in attacking/middle third")
    field_tilt_pct: float = Field(..., description="Final third territorial dominance (home %)")
    defensive_line_depth_m: float = Field(..., description="Estimated defensive line distance from own goal line in meters")


class ExplainabilityContext(BaseModel):
    significance_level: str = Field(..., description="low, medium, high, critical")
    why_it_matters: str
    tactical_pattern: str
    player_impact: str
    evidence_event_ids: List[str] = []


class MatchEvent(BaseModel):
    event_id: str
    match_id: str
    timestamp_s: float  # Simulated match clock in seconds
    wall_clock_iso: Optional[str] = None  # Real server timestamp for audit & sync
    minute: int
    second: int
    match_phase: MatchPhase = MatchPhase.FIRST_HALF
    team_id: str
    team_name: str
    player_id: str
    player_name: str
    event_type: EventType
    location: PitchLocation
    pass_detail: Optional[PassDetail] = None
    shot_detail: Optional[ShotDetail] = None
    tactical_metrics: TacticalMetricState
    explainability: ExplainabilityContext
    metadata: Dict[str, Any] = {}


class AgentInsight(BaseModel):
    insight_id: str
    match_id: str
    agent_name: str  # TacticalAnalyst, LiveCommentator, RecapNarrative, MultilingualTranslator
    role: str
    timestamp_s: float  # Match clock time
    minute: int
    headline: str
    content: str
    persona_target: str = Field(..., description="all, analyst, casual, player_focus")
    language: str = "en"
    importance: str = "medium"  # low, medium, high, critical
    confidence: float = Field(default=0.90, description="Estimated confidence score [0.0, 1.0]")
    evidence_event_ids: List[str] = []
    supporting_metrics: Dict[str, Any] = {}
    expiry_s: float = Field(default=15.0, description="Display overlay duration in seconds")
    audio_cue: Optional[str] = None


class MatchStateSnapshot(BaseModel):
    match_id: str
    home_team: Team
    away_team: Team
    home_score: int = 0
    away_score: int = 0
    current_time_s: float = 0.0
    minute: int = 0
    phase: MatchPhase = MatchPhase.FIRST_HALF
    ball_position: PitchLocation
    recent_events: List[MatchEvent] = []
    latest_insights: List[AgentInsight] = []
    tactical_metrics: TacticalMetricState
