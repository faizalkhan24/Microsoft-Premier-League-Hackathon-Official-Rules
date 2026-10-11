import random
import time
from typing import Generator, List, Optional
from backend.models.schemas import (
    MatchEvent,
    EventType,
    MatchPhase,
    PitchLocation,
    PassDetail,
    ShotDetail,
    Team,
    Player,
)
from backend.simulator.rosters import get_premier_league_teams
from backend.analytics.metrics_engine import MetricsEngine


class SyntheticMatchSimulator:
    """
    Generates realistic synthetic Premier League match event streams.
    Simulates positional football tactics, player physics, expected goals,
    pass trajectories, pressing intensity, and goal sequences.
    """

    def __init__(self, match_id: str = "pl_ars_mci_2026"):
        self.match_id = match_id
        self.home_team, self.away_team = get_premier_league_teams()
        self.engine = MetricsEngine()
        self.current_time_s = 0.0
        self.home_score = 0
        self.away_score = 0
        self.event_counter = 0

        # Current possession
        self.possession_team: Team = self.home_team
        self.current_ball_loc = PitchLocation(x=52.5, y=34.0, z=0.0)

    def _select_next_player(self, team: Team, current_role: str = "any") -> Player:
        field_players = [p for p in team.roster if p.position != "GK"]
        if current_role == "attacker":
            attackers = [p for p in team.roster if p.position in ["ST", "RW", "LW", "CAM"]]
            return random.choice(attackers)
        elif current_role == "midfield":
            mids = [p for p in team.roster if p.position in ["CDM", "CM", "CAM"]]
            return random.choice(mids)
        elif current_role == "defense":
            defenders = [p for p in team.roster if p.position in ["CB", "LB", "RB"]]
            return random.choice(defenders)
        return random.choice(field_players)

    def step_event(self) -> MatchEvent:
        """
        Advances the match clock by 3-12 seconds and simulates the next logical football action.
        """
        self.event_counter += 1
        time_delta = random.uniform(4.0, 11.0)
        self.current_time_s += time_delta
        minute = int(self.current_time_s // 60)
        second = int(self.current_time_s % 60)

        phase = MatchPhase.FIRST_HALF
        if minute >= 45 and minute < 46 and self.current_time_s < 2700:
            phase = MatchPhase.HALF_TIME
        elif minute >= 45:
            phase = MatchPhase.SECOND_HALF
        if minute >= 90:
            phase = MatchPhase.FULL_TIME

        team = self.possession_team
        opp_team = self.away_team if team.id == self.home_team.id else self.home_team

        # Tactical state probabilities based on field position
        in_attacking_third = (self.current_ball_loc.x > 72.0 and team.id == "arsenal") or (
            self.current_ball_loc.x < 33.0 and team.id == "mancity"
        )

        event_dice = random.random()
        pass_detail: Optional[PassDetail] = None
        shot_detail: Optional[ShotDetail] = None
        is_turnover = False

        # Determine next action
        if in_attacking_third and event_dice < 0.35:
            # SHOT OPPORTUNITY
            event_type = EventType.SHOT
            shooter = self._select_next_player(team, current_role="attacker")
            player = shooter

            # Target goal coordinate (Home shoots at 105, Away shoots at 0)
            target_x = 105.0 if team.id == "arsenal" else 0.0
            target_y = random.uniform(31.5, 36.5)
            target_loc = PitchLocation(x=target_x, y=target_y, z=random.uniform(0.1, 1.8))

            shot_type = random.choice(["open_play", "open_play", "volley", "header"])
            xg = self.engine.calculate_xg(self.current_ball_loc, shot_type=shot_type)
            shot_speed = random.uniform(84.0, 118.5)

            # Goal probability correlated with xG
            is_goal = random.random() < (xg * 1.25)
            on_target = is_goal or (random.random() < 0.65)

            if is_goal:
                event_type = EventType.GOAL
                if team.id == "arsenal":
                    self.home_score += 1
                else:
                    self.away_score += 1
                # Kickoff resets ball to center circle
                self.current_ball_loc = PitchLocation(x=52.5, y=34.0, z=0.0)
                self.possession_team = opp_team
            else:
                # Shot blocked or saved -> possession might flip
                if random.random() < 0.5:
                    self.possession_team = opp_team
                    is_turnover = True

            shot_detail = ShotDetail(
                shot_type=shot_type,
                location=self.current_ball_loc,
                target_location=target_loc,
                xg=xg,
                shot_speed_kmh=round(shot_speed, 1),
                on_target=on_target,
                is_goal=is_goal,
            )

        elif event_dice < 0.16:
            # TURNOVER / INTERCEPTION / TACKLE
            event_type = random.choice([EventType.TURNOVER, EventType.TACKLE, EventType.INTERCEPTION])
            is_turnover = True
            player = self._select_next_player(opp_team, current_role="defense")
            # Flip possession
            self.possession_team = opp_team

        else:
            # PASSING SEQUENCE
            event_type = EventType.PASS
            passer = self._select_next_player(team)
            receiver = self._select_next_player(team)
            while receiver.id == passer.id:
                receiver = self._select_next_player(team)

            # Realistic movement towards opponent goal
            direction = 1.0 if team.id == "arsenal" else -1.0
            dx = random.uniform(4.0, 22.0) * direction
            dy = random.uniform(-18.0, 18.0)

            new_x = max(2.0, min(103.0, self.current_ball_loc.x + dx))
            new_y = max(3.0, min(65.0, self.current_ball_loc.y + dy))
            end_loc = PitchLocation(x=round(new_x, 1), y=round(new_y, 1), z=0.0)

            dist_m = self.engine.calculate_distance(self.current_ball_loc, end_loc)
            is_line_breaking = dist_m > 18.0 and abs(dx) > 12.0
            difficulty = self.engine.calculate_pass_difficulty(
                self.current_ball_loc, end_loc, is_line_breaking=is_line_breaking
            )

            success = random.random() > (difficulty * 0.45)
            pass_speed = random.uniform(38.0, 72.0)

            pass_detail = PassDetail(
                recipient_id=receiver.id if success else None,
                recipient_name=receiver.name if success else None,
                start_location=self.current_ball_loc,
                end_location=end_loc,
                distance_m=round(dist_m, 1),
                difficulty_rating=difficulty,
                success=success,
                is_line_breaking=is_line_breaking,
                speed_kmh=round(pass_speed, 1),
            )

            player = passer
            if success:
                self.current_ball_loc = end_loc
            else:
                is_turnover = True
                self.possession_team = opp_team

        # Tactical state update
        tactical_metrics = self.engine.update_tactical_state(
            event_type=event_type,
            team_id=team.id,
            location=self.current_ball_loc,
            success=pass_detail.success if pass_detail else True,
            is_turnover=is_turnover,
        )

        explainability = self.engine.generate_explainability_context(
            event_type=event_type,
            player_name=player.name,
            team_name=team.name,
            location=self.current_ball_loc,
            pass_detail=pass_detail,
            shot_detail=shot_detail,
            is_turnover=is_turnover,
        )

        event = MatchEvent(
            event_id=f"ev_{self.event_counter:04d}",
            match_id=self.match_id,
            timestamp_s=round(self.current_time_s, 1),
            minute=minute,
            second=second,
            match_phase=phase,
            team_id=team.id,
            team_name=team.name,
            player_id=player.id,
            player_name=player.name,
            event_type=event_type,
            location=self.current_ball_loc,
            pass_detail=pass_detail,
            shot_detail=shot_detail,
            tactical_metrics=tactical_metrics,
            explainability=explainability,
            metadata={
                "home_score": self.home_score,
                "away_score": self.away_score,
                "home_team": self.home_team.short_name,
                "away_team": self.away_team.short_name,
            },
        )

        return event

    def generate_full_match_stream(self, total_events: int = 120) -> List[MatchEvent]:
        events = []
        for _ in range(total_events):
            event = self.step_event()
            events.append(event)
            if event.match_phase == MatchPhase.FULL_TIME:
                break
        return events
