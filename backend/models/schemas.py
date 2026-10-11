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
    x: float = Field(..., description="Pitch X coordinate in meters [0.0, 105.0] (0 = own goal line, 105 = opponent goal line)")
    y: float = Field(..., description="Pitch Y coordinate in meters [0.0, 68.0] (0 = left sideline, 68 = right sideline)")
    z: float = Field(default=0.0, description="Ball height in meters [0.0, 10.0]")


class Player(BaseModel):
    id: str
    name: str
    number: int
    team_id: str
    position: str  # GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST
    speed_mps: float = 0.0  # Current speed in meters/second
    distance_covered_m: float = 0.0
    stamina_pct: float = 100.0


class Team(BaseModel):
    id: str
    name: str
    short_name: str
    primary_color: str
    secondary_color: str
    formation: str
    roster: List[Player] = []


class PassDetail(BaseModel):
    recipient_id: Optional[str] = None
    recipient_name: Optional[str] = None
    start_location: PitchLocation
    end_location: PitchLocation
    distance_m: float
    difficulty_rating: float  # [0.0, 1.0] scale
    success: bool
    is_line_breaking: bool = False
    speed_kmh: float = 0.0


class ShotDetail(BaseModel):
    shot_type: str  # "open_play", "free_kick", "header", "volley"
    location: PitchLocation
    target_location: PitchLocation
    xg: float  # Expected Goals [0.01, 0.99]
    shot_speed_kmh: float
    on_target: bool
    is_goal: bool


class TacticalMetricState(BaseModel):
    control_vs_chaos: float = Field(..., description="Scale 0-100: 0=pure chaos/turnover ping-pong, 100=absolute controlled possession")
    home_momentum: float = Field(..., description="0-100% momentum indicator for home team")
    away_momentum: float = Field(..., description="0-100% momentum indicator for away team")
    pressing_intensity_ppda: float = Field(..., description="Passes Allowed Per Defensive Action")
    field_tilt_pct: float = Field(..., description="Territorial dominance in final third (home %)")
    defensive_line_depth_m: float = Field(..., description="Average defensive line height from own goal line")


class ExplainabilityContext(BaseModel):
    significance_level: str  # "low", "medium", "high", "critical"
    why_it_matters: str
    tactical_pattern: str  # e.g., "Overload to isolate", "High-press turnover", "Counter-attack transition"
    player_impact: str


class MatchEvent(BaseModel):
    event_id: str
    match_id: str
    timestamp_s: float  # Match clock in seconds (e.g. 1845.2 = 30:45)
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
    agent_name: str  # "TacticalAnalyst", "LiveCommentator", "RecapNarrative", "MultilingualTranslator"
    role: str
    timestamp_s: float
    minute: int
    headline: str
    content: str
    persona_target: str  # "all", "analyst", "casual", "player_focus"
    language: str = "en"
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
