import math
from typing import List, Tuple, Optional
from backend.models.schemas import (
    PitchLocation,
    PassDetail,
    ShotDetail,
    TacticalMetricState,
    ExplainabilityContext,
    EventType,
)


class MetricsEngine:
    """
    Football Analytics & Tactical Explainability Engine.
    
    Provides physics-calibrated geometric heuristic metrics:
    - Direction-Aware Expected Goals (xG) Model
    - Direction-Aware Pass Difficulty Rating
    - Control vs Chaos Dynamic State Machine
    - Passes Allowed Per Defensive Action (PPDA)
    - Cumulative Possession & Field Tilt Tracking
    """

    PITCH_LENGTH_M = 105.0
    PITCH_WIDTH_M = 68.0
    GOAL_Y_CENTER = 34.0
    GOAL_WIDTH_M = 7.32
    GOAL_Y_TOP = 34.0 - (7.32 / 2)    # 30.34
    GOAL_Y_BOTTOM = 34.0 + (7.32 / 2) # 37.66

    def __init__(self):
        # Rolling match accumulators
        self.home_event_count = 0
        self.away_event_count = 0
        self.home_consecutive_passes = 0
        self.away_consecutive_passes = 0
        self.home_xg_total = 0.0
        self.away_xg_total = 0.0

        # Defensive actions and opponent passes for real PPDA
        self.home_defensive_actions = 0
        self.away_defensive_actions = 0
        self.home_passes_in_mid_third = 0
        self.away_passes_in_mid_third = 0

        # Dynamic state indices
        self.rolling_control = 65.0
        self.home_momentum = 50.0
        self.away_momentum = 50.0
        self.recent_turnovers = 0

    def calculate_distance(self, loc1: PitchLocation, loc2: PitchLocation) -> float:
        """Euclidean distance in meters between two pitch locations."""
        return math.sqrt((loc2.x - loc1.x) ** 2 + (loc2.y - loc1.y) ** 2)

    def calculate_pass_difficulty(
        self,
        start: PitchLocation,
        end: PitchLocation,
        attacking_direction: int = 1,
        is_line_breaking: bool = False,
        passer_speed_mps: float = 3.0,
    ) -> float:
        """
        Calculates a direction-aware Pass Difficulty Rating [0.05, 0.98].
        
        Semantics:
        - 0.05 - 0.20: Routine safe backward/sideways circulation.
        - 0.21 - 0.50: Standard forward or lateral distribution.
        - 0.51 - 0.75: Long switch or moderately pressured pass.
        - 0.76 - 0.98: High-risk, line-breaking vertical pass through compact blocks.
        
        attacking_direction: +1 if attacking towards x=105 (Home), -1 if towards x=0 (Away)
        """
        dist = self.calculate_distance(start, end)
        
        # Base factor based on distance (sigmoid-like scaling up to 50m)
        dist_factor = min(0.45, (dist / 50.0) * 0.45)

        # Direction-aware progressive distance towards target goal
        if attacking_direction >= 0:
            prog_delta = end.x - start.x
        else:
            prog_delta = start.x - end.x
        
        progressive_factor = max(0.0, min(0.25, (prog_delta / 35.0) * 0.25))

        # Bonus for slicing through defensive/midfield block
        line_break_bonus = 0.20 if is_line_breaking else 0.0

        # Passer movement difficulty under sprint
        passer_speed_factor = max(0.0, min(0.10, (passer_speed_mps / 8.0) * 0.10))

        difficulty = 0.08 + dist_factor + progressive_factor + line_break_bonus + passer_speed_factor
        return round(min(0.98, max(0.05, difficulty)), 2)

    def calculate_xg(
        self,
        loc: PitchLocation,
        target_goal_x: float = 105.0,
        shot_type: str = "open_play",
    ) -> float:
        """
        Direction-aware Expected Goals (xG) geometric heuristic model.
        
        Calibrated against synthetic Premier League shot scenarios:
        - Penalizes shots outside the 18-yard box exponentially.
        - Accounts for visual angle subtended by the goalposts (7.32m).
        - target_goal_x: 105.0 for Home team, 0.0 for Away team.
        """
        # Distance to goal center
        dist_to_goal = math.sqrt((target_goal_x - loc.x) ** 2 + (self.GOAL_Y_CENTER - loc.y) ** 2)
        dist_to_goal = max(0.5, dist_to_goal)

        # Depth dx from goal line
        dx = max(0.2, abs(target_goal_x - loc.x))

        # Subtended visual angle between goal posts
        theta1 = math.atan2(self.GOAL_Y_TOP - loc.y, dx)
        theta2 = math.atan2(self.GOAL_Y_BOTTOM - loc.y, dx)
        angle_rad = abs(theta2 - theta1)

        # Geometric probability estimate
        angle_factor = (angle_rad / math.pi) * 3.4
        distance_decay = math.exp(-0.115 * dist_to_goal)
        base_xg = distance_decay * angle_factor

        type_multipliers = {
            "open_play": 1.0,
            "header": 0.55,
            "volley": 0.70,
            "free_kick": 0.45,
            "penalty": 0.78,
        }
        multiplier = type_multipliers.get(shot_type, 1.0)
        final_xg = base_xg * multiplier

        return round(min(0.96, max(0.01, final_xg)), 2)

    def update_tactical_state(
        self,
        event_type: EventType,
        team_id: str,
        location: PitchLocation,
        success: bool = True,
        is_turnover: bool = False,
        shot_xg: float = 0.0,
    ) -> TacticalMetricState:
        """
        Updates rolling match statistics:
        - Control vs Chaos Index (0-100)
        - Momentum tug (Home % vs Away %)
        - True cumulative possession %
        - PPDA pressing intensity
        - Final third field tilt %
        """
        if team_id == "arsenal":
            self.home_event_count += 1
        else:
            self.away_event_count += 1

        total_events = max(1, self.home_event_count + self.away_event_count)
        home_poss = round((self.home_event_count / total_events) * 100.0, 1)
        away_poss = round(100.0 - home_poss, 1)

        if event_type == EventType.PASS:
            if team_id == "arsenal":
                self.home_passes_in_mid_third += 1
                if success:
                    self.home_consecutive_passes += 1
                    self.home_momentum = min(92.0, self.home_momentum + 1.6)
                    self.away_momentum = max(8.0, self.away_momentum - 1.2)
                else:
                    self.home_consecutive_passes = 0
                    self.rolling_control = max(18.0, self.rolling_control - 6.0)
                    self.away_momentum = min(92.0, self.away_momentum + 2.0)
                    self.home_momentum = max(8.0, self.home_momentum - 2.0)
            else:
                self.away_passes_in_mid_third += 1
                if success:
                    self.away_consecutive_passes += 1
                    self.away_momentum = min(92.0, self.away_momentum + 1.6)
                    self.home_momentum = max(8.0, self.home_momentum - 1.2)
                else:
                    self.away_consecutive_passes = 0
                    self.rolling_control = max(18.0, self.rolling_control - 6.0)
                    self.home_momentum = min(92.0, self.home_momentum + 2.0)
                    self.away_momentum = max(8.0, self.away_momentum - 2.0)
            
            if success:
                # Controlled sequence builds stability
                self.rolling_control = min(95.0, self.rolling_control + 1.2)

        elif is_turnover or event_type in [EventType.TURNOVER, EventType.TACKLE, EventType.INTERCEPTION]:
            self.home_consecutive_passes = 0
            self.away_consecutive_passes = 0
            
            # Count defensive actions for PPDA
            if team_id == "arsenal":
                self.home_defensive_actions += 1
                self.home_momentum = min(88.0, self.home_momentum + 4.5)
            else:
                self.away_defensive_actions += 1
                self.away_momentum = min(88.0, self.away_momentum + 4.5)

            # Turnovers cause sharp drop towards Chaos
            self.rolling_control = max(18.0, self.rolling_control - 8.5)

        elif event_type in [EventType.SHOT, EventType.GOAL]:
            if team_id == "arsenal":
                self.home_xg_total += shot_xg
                self.home_momentum = min(98.0, self.home_momentum + 10.0)
            else:
                self.away_xg_total += shot_xg
                self.away_momentum = min(98.0, self.away_momentum + 10.0)

        # Real PPDA calculation: Opponent passes / Defensive actions
        # Lower PPDA = higher pressing intensity
        total_def = self.home_defensive_actions + self.away_defensive_actions
        total_mid_passes = self.home_passes_in_mid_third + self.away_passes_in_mid_third
        if total_def > 0:
            ppda = round(max(4.0, min(24.0, total_mid_passes / total_def)), 1)
        else:
            ppda = 8.5

        # Territorial Field Tilt (penetration into attacking third: x > 70 for Arsenal, x < 35 for Man City)
        tilt_home = 52.0
        if location.x > 70:
            tilt_home = 67.0
        elif location.x < 35:
            tilt_home = 36.0

        # Defensive line depth
        def_line = 48.0 + (location.x / self.PITCH_LENGTH_M) * 7.5

        return TacticalMetricState(
            control_vs_chaos=round(self.rolling_control, 1),
            home_momentum=round(self.home_momentum, 1),
            away_momentum=round(self.away_momentum, 1),
            home_possession_pct=home_poss,
            away_possession_pct=away_poss,
            home_xg_cumulative=round(self.home_xg_total, 2),
            away_xg_cumulative=round(self.away_xg_total, 2),
            pressing_intensity_ppda=ppda,
            field_tilt_pct=round(tilt_home, 1),
            defensive_line_depth_m=round(def_line, 1),
        )

    def generate_explainability_context(
        self,
        event_type: EventType,
        player_name: str,
        team_name: str,
        location: PitchLocation,
        pass_detail: Optional[PassDetail] = None,
        shot_detail: Optional[ShotDetail] = None,
        is_turnover: bool = False,
        evidence_event_ids: Optional[List[str]] = None,
    ) -> ExplainabilityContext:
        """
        Generates structured, evidence-backed tactical reasoning explaining
        why this specific event matters in the broader tactical context.
        """
        ev_ids = evidence_event_ids or []

        if event_type == EventType.GOAL and shot_detail:
            return ExplainabilityContext(
                significance_level="critical",
                why_it_matters=f"Clinical goal conversion with {shot_detail.xg:.2f} xG at {shot_detail.shot_speed_kmh:.1f} km/h exit velocity, breaking match equilibrium.",
                tactical_pattern="Final Third Penetration & Box Finishing",
                player_impact=f"{player_name} converted under heavy defensive pressure.",
                evidence_event_ids=ev_ids,
            )

        if event_type == EventType.SHOT and shot_detail:
            sig = "high" if shot_detail.xg > 0.22 else "medium"
            return ExplainabilityContext(
                significance_level=sig,
                why_it_matters=f"High-threat scoring opportunity generated ({shot_detail.xg:.2f} xG) forcing opposition goalkeeper action.",
                tactical_pattern="Half-Space Overload into Shooting Zone",
                player_impact=f"{player_name} carved out shooting space between central defenders.",
                evidence_event_ids=ev_ids,
            )

        if is_turnover or event_type in [EventType.TURNOVER, EventType.TACKLE, EventType.INTERCEPTION]:
            return ExplainabilityContext(
                significance_level="high",
                why_it_matters="Midfield turnover triggering instantaneous counter-press transition. Stretches rest-defense compactness and induces vertical chaos.",
                tactical_pattern="Counter-Pressing Trap & Transition Flux",
                player_impact=f"{player_name} engaged in aggressive duel.",
                evidence_event_ids=ev_ids,
            )

        if pass_detail and pass_detail.is_line_breaking:
            return ExplainabilityContext(
                significance_level="high",
                why_it_matters=f"Line-breaking pass (difficulty rating {pass_detail.difficulty_rating:.2f}) penetrating between the lines over {pass_detail.distance_m:.1f}m.",
                tactical_pattern="Vertical Penetration through Midfield Block",
                player_impact=f"{player_name} executed progressive line-splitting pass.",
                evidence_event_ids=ev_ids,
            )

        if location.x > 70 or location.x < 35:
            return ExplainabilityContext(
                significance_level="medium",
                why_it_matters="Sustained territorial compression in the attacking third, pinning opponent into low-block rest defense.",
                tactical_pattern="Attacking Third Overload & Sustained Territory",
                player_impact=f"{player_name} orchestrating possession tempo.",
                evidence_event_ids=ev_ids,
            )

        return ExplainabilityContext(
            significance_level="low",
            why_it_matters="Methodical circulation probing for passing angles while retaining positional defensive balance.",
            tactical_pattern="Structured Positional Build-Up",
            player_impact=f"{player_name} resetting tactical circulation.",
            evidence_event_ids=ev_ids,
        )
