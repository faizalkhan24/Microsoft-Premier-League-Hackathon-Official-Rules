import math
from typing import List, Tuple
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
    Computes explainable football intelligence and physics-based metrics:
    - Pass Difficulty Rating: geometric distance, pass trajectory, pressure on passer & receiver
    - Expected Goals (xG): distance to goal center, angle to goalposts, shot pressure
    - Control vs Chaos Index: rolling turnover frequency, possession duration, passing fluency
    - Momentum & Field Tilt: territory penetration and offensive threat accumulation
    """

    GOAL_X = 105.0
    GOAL_Y = 34.0  # Center of pitch width (68m / 2)
    GOAL_WIDTH = 7.32

    def __init__(self):
        self.recent_events_window: List[dict] = []
        self.home_consecutive_passes = 0
        self.away_consecutive_passes = 0
        self.recent_turnovers = 0
        self.rolling_control = 65.0
        self.home_momentum = 50.0
        self.away_momentum = 50.0

    def calculate_distance(self, loc1: PitchLocation, loc2: PitchLocation) -> float:
        return math.sqrt((loc2.x - loc1.x) ** 2 + (loc2.y - loc1.y) ** 2)

    def calculate_pass_difficulty(
        self,
        start: PitchLocation,
        end: PitchLocation,
        is_line_breaking: bool = False,
        passer_speed_mps: float = 3.0,
    ) -> float:
        """
        Calculates a pass difficulty rating between 0.05 (simple sideways pass) and 0.95 (risky defense-splitting through ball).
        """
        dist = self.calculate_distance(start, end)
        
        # Base difficulty based on distance (sigmoid curve)
        dist_factor = min(1.0, dist / 45.0) * 0.45

        # Forward progression factor (progressive passes are more contested)
        progression = max(0.0, (end.x - start.x) / 35.0) * 0.25

        # Line-breaking difficulty bonus
        line_break_bonus = 0.20 if is_line_breaking else 0.0

        # Passer movement difficulty
        movement_factor = min(0.10, (passer_speed_mps / 8.0) * 0.10)

        difficulty = 0.08 + dist_factor + progression + line_break_bonus + movement_factor
        return round(min(0.98, max(0.05, difficulty)), 2)

    def calculate_xg(self, loc: PitchLocation, shot_type: str = "open_play") -> float:
        """
        Calibrated Expected Goals (xG) model based on Euclidean distance, shooting angle, and shot style.
        Goal line is at x=105, center is y=34.
        """
        dist_to_goal = math.sqrt((self.GOAL_X - loc.x) ** 2 + (self.GOAL_Y - loc.y) ** 2)
        dist_to_goal = max(1.0, dist_to_goal)

        # Angle subtended by goal posts
        # Left post: (105, 30.34), Right post: (105, 37.66)
        y1 = self.GOAL_Y - (self.GOAL_WIDTH / 2)
        y2 = self.GOAL_Y + (self.GOAL_WIDTH / 2)
        dx = max(0.5, self.GOAL_X - loc.x)

        theta1 = math.atan2(y1 - loc.y, dx)
        theta2 = math.atan2(y2 - loc.y, dx)
        angle_rad = abs(theta2 - theta1)

        # Base exponential decay model
        base_xg = math.exp(-0.11 * dist_to_goal) * (angle_rad / math.pi * 3.2)

        type_multipliers = {
            "open_play": 1.0,
            "header": 0.58,
            "volley": 0.72,
            "free_kick": 0.45,
            "penalty": 0.79,
        }
        multiplier = type_multipliers.get(shot_type, 1.0)
        final_xg = base_xg * multiplier
        return round(min(0.95, max(0.02, final_xg)), 2)

    def update_tactical_state(
        self,
        event_type: EventType,
        team_id: str,
        location: PitchLocation,
        success: bool = True,
        is_turnover: bool = False,
    ) -> TacticalMetricState:
        """
        Dynamically updates the Control vs Chaos index, momentum, field tilt, and pressing intensity.
        """
        if event_type == EventType.PASS and success:
            if team_id == "arsenal":
                self.home_consecutive_passes += 1
                self.home_momentum = min(92.0, self.home_momentum + 1.8)
                self.away_momentum = max(8.0, self.away_momentum - 1.2)
            else:
                self.away_consecutive_passes += 1
                self.away_momentum = min(92.0, self.away_momentum + 1.8)
                self.home_momentum = max(8.0, self.home_momentum - 1.2)
            self.rolling_control = min(95.0, self.rolling_control + 1.5)

        elif is_turnover or event_type in [EventType.TURNOVER, EventType.TACKLE, EventType.INTERCEPTION]:
            self.home_consecutive_passes = 0
            self.away_consecutive_passes = 0
            # A turnover sharply pushes state towards CHAOS
            self.rolling_control = max(18.0, self.rolling_control - 9.0)

            # Transition momentum shift
            if team_id == "arsenal":
                self.away_momentum = min(85.0, self.away_momentum + 5.0)
            else:
                self.home_momentum = min(85.0, self.home_momentum + 5.0)

        elif event_type in [EventType.SHOT, EventType.GOAL]:
            if team_id == "arsenal":
                self.home_momentum = min(98.0, self.home_momentum + 12.0)
            else:
                self.away_momentum = min(98.0, self.away_momentum + 12.0)

        # Field tilt: penetration into attacking third (x > 70 for home, x < 35 for away)
        field_tilt_home = 54.0
        if location.x > 70:
            field_tilt_home = 68.5
        elif location.x < 35:
            field_tilt_home = 38.0

        # Defensive line depth in meters (Arsenal ~ 48m, Man City ~ 51m)
        def_line = 48.0 + (location.x / 105.0) * 8.0

        return TacticalMetricState(
            control_vs_chaos=round(self.rolling_control, 1),
            home_momentum=round(self.home_momentum, 1),
            away_momentum=round(self.away_momentum, 1),
            pressing_intensity_ppda=round(7.8 + (100 - self.rolling_control) * 0.08, 1),
            field_tilt_pct=round(field_tilt_home, 1),
            defensive_line_depth_m=round(def_line, 1),
        )

    def generate_explainability_context(
        self,
        event_type: EventType,
        player_name: str,
        team_name: str,
        location: PitchLocation,
        pass_detail: PassDetail | None = None,
        shot_detail: ShotDetail | None = None,
        is_turnover: bool = False,
    ) -> ExplainabilityContext:
        """
        Translates raw football events into deep, explainable tactical context:
        Why does this specific moment matter in the flow of the match?
        """
        if event_type == EventType.GOAL and shot_detail:
            return ExplainabilityContext(
                significance_level="critical",
                why_it_matters=f"Clinical finish with {shot_detail.xg:.2f} xG at {shot_detail.shot_speed_kmh:.1f} km/h, breaking the deadlock and forcing tactical restructuring.",
                tactical_pattern="Final Third Penetration & Box Finishing",
                player_impact=f"{player_name} converted under heavy defensive pressure.",
            )

        if event_type == EventType.SHOT and shot_detail:
            sig = "high" if shot_detail.xg > 0.25 else "medium"
            return ExplainabilityContext(
                significance_level=sig,
                why_it_matters=f"High-value scoring chance created ({shot_detail.xg:.2f} xG) testing the goalkeeper's positioning and defensive recovery speed.",
                tactical_pattern="Overload into Shooting Zone",
                player_impact=f"{player_name} found space between the center backs.",
            )

        if is_turnover or event_type == EventType.TURNOVER:
            return ExplainabilityContext(
                significance_level="high",
                why_it_matters="High-turnover event triggering an instant counter-pressing transition. Disrupts possession stability and creates vertical chaos.",
                tactical_pattern="Rest Defense Vulnerability & Pressing Trap",
                player_impact=f"{player_name} was caught under aggressive dual-pressure.",
            )

        if pass_detail and pass_detail.is_line_breaking:
            return ExplainabilityContext(
                significance_level="high",
                why_it_matters=f"Superb line-breaking pass (difficulty rating {pass_detail.difficulty_rating:.2f}) bypassing 4 opponents to unlock the half-space.",
                tactical_pattern="Vertical Penetration through Midfield Block",
                player_impact=f"{player_name} spotted the passing lane through the midfield pivot.",
            )

        if location.x > 70:
            return ExplainabilityContext(
                significance_level="medium",
                why_it_matters="Sustained territorial pressure in the final third, pinning the opposition low block into deep penalty box defense.",
                tactical_pattern="Positional Overload & Sustained Territory",
                player_impact=f"{player_name} maintaining high circulation tempo.",
            )

        return ExplainabilityContext(
            significance_level="low",
            why_it_matters="Structured circulation probing for passing angles while preserving defensive balance.",
            tactical_pattern="Build-up Circulation",
            player_impact=f"{player_name} resetting the tempo.",
        )
