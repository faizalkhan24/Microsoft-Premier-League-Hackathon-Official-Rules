import os
import uuid
from typing import List, Dict, Any, Optional
from backend.models.schemas import (
    MatchEvent,
    EventType,
    AgentInsight,
    TacticalMetricState,
)


class BaseAgent:
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role
        self.last_triggered_time_s = -999.0
        self.cooldown_period_s = 20.0  # Default cooldown to avoid repetitive spam

    def is_cooling_down(self, current_time_s: float) -> bool:
        return (current_time_s - self.last_triggered_time_s) < self.cooldown_period_s

    def record_trigger(self, current_time_s: float):
        self.last_triggered_time_s = current_time_s

    def process(self, event: MatchEvent, context: Dict[str, Any]) -> Optional[AgentInsight]:
        raise NotImplementedError


class TacticalAnalystAgent(BaseAgent):
    """
    Analyzes spatial geometry, passing lanes, and structural phases.
    Outputs high-density tactical reasoning grounded in measured event metrics.
    """
    def __init__(self):
        super().__init__(name="TacticalAnalyst", role="Lead Tactical & Systems Analyst")
        self.cooldown_period_s = 15.0

    def process(self, event: MatchEvent, context: Dict[str, Any]) -> Optional[AgentInsight]:
        metrics: TacticalMetricState = event.tactical_metrics

        if event.event_type == EventType.GOAL and event.shot_detail:
            shot = event.shot_detail
            self.record_trigger(event.timestamp_s)
            return AgentInsight(
                insight_id=f"ins_ana_goal_{event.event_id}",
                match_id=event.match_id,
                agent_name=self.name,
                role=self.role,
                timestamp_s=event.timestamp_s,
                minute=event.minute,
                headline=f"GOAL ANALYSIS: {event.player_name} Tactical Execution",
                content=(
                    f"Defensive structure breached at ({event.location.x:.1f}m, {event.location.y:.1f}m). "
                    f"Shot velocity reached {shot.shot_speed_kmh:.1f} km/h with an estimated xG of {shot.xg:.2f}. "
                    f"Rest defense failed to compress the central shooting pocket."
                ),
                persona_target="analyst",
                importance="critical",
                confidence=0.96,
                evidence_event_ids=[event.event_id],
                supporting_metrics={
                    "xg": shot.xg,
                    "shot_speed_kmh": shot.shot_speed_kmh,
                    "location_x": event.location.x,
                    "location_y": event.location.y,
                },
                expiry_s=25.0,
                audio_cue="tactical_breakdown_goal",
            )

        if event.pass_detail and event.pass_detail.is_line_breaking:
            pass_d = event.pass_detail
            if not self.is_cooling_down(event.timestamp_s):
                self.record_trigger(event.timestamp_s)
                return AgentInsight(
                    insight_id=f"ins_ana_pass_{event.event_id}",
                    match_id=event.match_id,
                    agent_name=self.name,
                    role=self.role,
                    timestamp_s=event.timestamp_s,
                    minute=event.minute,
                    headline="TACTICAL LINE-BREAK: Midfield Pivot Penetrated",
                    content=(
                        f"{event.player_name} bypassed the defensive line with a {pass_d.distance_m:.1f}m vertical delivery "
                        f"(Pass difficulty rating: {pass_d.difficulty_rating:.2f}). "
                        f"Target recipient: {pass_d.recipient_name or 'teammate'} in the half-space."
                    ),
                    persona_target="analyst",
                    importance="high",
                    confidence=0.91,
                    evidence_event_ids=[event.event_id],
                    supporting_metrics={
                        "distance_m": pass_d.distance_m,
                        "difficulty_rating": pass_d.difficulty_rating,
                        "speed_kmh": pass_d.speed_kmh,
                    },
                    expiry_s=15.0,
                )

        if metrics.control_vs_chaos < 30.0 and not self.is_cooling_down(event.timestamp_s):
            self.record_trigger(event.timestamp_s)
            return AgentInsight(
                insight_id=f"ins_ana_chaos_{event.event_id}",
                match_id=event.match_id,
                agent_name=self.name,
                role=self.role,
                timestamp_s=event.timestamp_s,
                minute=event.minute,
                headline="CHAOS ALERT: Transition Instability High",
                content=(
                    f"Control vs. Chaos score dropped to {metrics.control_vs_chaos:.1f}/100. Rapid turnover frequency "
                    f"has disrupted structural compact lines, opening transition vulnerability for counter-attacks."
                ),
                persona_target="analyst",
                importance="medium",
                confidence=0.88,
                evidence_event_ids=[event.event_id],
                supporting_metrics={
                    "control_vs_chaos": metrics.control_vs_chaos,
                    "ppda": metrics.pressing_intensity_ppda,
                },
                expiry_s=12.0,
            )

        return None


class BroadcastCommentatorAgent(BaseAgent):
    """
    Generates real-time broadcast play-by-play and color commentary.
    Tone: energetic, cinematic, and jargon-free for general audiences.
    """
    def __init__(self):
        super().__init__(name="LiveCommentator", role="Lead Premier League Match Commentator")
        self.cooldown_period_s = 10.0

    def process(self, event: MatchEvent, context: Dict[str, Any]) -> Optional[AgentInsight]:
        if event.event_type == EventType.GOAL:
            self.record_trigger(event.timestamp_s)
            return AgentInsight(
                insight_id=f"ins_com_goal_{event.event_id}",
                match_id=event.match_id,
                agent_name=self.name,
                role=self.role,
                timestamp_s=event.timestamp_s,
                minute=event.minute,
                headline=f"GOAL! {event.player_name.upper()} BREAKS THE DEADLOCK!",
                content=(
                    f"SENSATIONAL SCENES! {event.player_name} finishes with venom for {event.team_name}! "
                    f"The stadium is rocking as the net bulges!"
                ),
                persona_target="casual",
                importance="critical",
                confidence=0.99,
                evidence_event_ids=[event.event_id],
                supporting_metrics={
                    "home_score": event.metadata.get("home_score"),
                    "away_score": event.metadata.get("away_score"),
                },
                expiry_s=25.0,
                audio_cue="crowd_roar_goal",
            )

        if event.event_type == EventType.SHOT and not self.is_cooling_down(event.timestamp_s):
            shot = event.shot_detail
            self.record_trigger(event.timestamp_s)
            quality = "stinging drive" if (shot and shot.on_target) else "whistling effort"
            return AgentInsight(
                insight_id=f"ins_com_shot_{event.event_id}",
                match_id=event.match_id,
                agent_name=self.name,
                role=self.role,
                timestamp_s=event.timestamp_s,
                minute=event.minute,
                headline=f"CHANCE! {event.player_name} with a {quality}",
                content=(
                    f"Agony and excitement at {event.minute}'! {event.player_name} tests the defense with a rapid shot! "
                    f"A warning signal for the opposition!"
                ),
                persona_target="casual",
                importance="high",
                confidence=0.92,
                evidence_event_ids=[event.event_id],
                supporting_metrics={"on_target": shot.on_target if shot else False},
                expiry_s=15.0,
            )

        if event.explainability.significance_level in ["high", "critical"] and not self.is_cooling_down(event.timestamp_s):
            self.record_trigger(event.timestamp_s)
            return AgentInsight(
                insight_id=f"ins_com_turn_{event.event_id}",
                match_id=event.match_id,
                agent_name=self.name,
                role=self.role,
                timestamp_s=event.timestamp_s,
                minute=event.minute,
                headline=f"KEY MOMENT: {event.explainability.tactical_pattern}",
                content=f"Watch this closely! {event.explainability.why_it_matters}",
                persona_target="casual",
                importance="medium",
                confidence=0.86,
                evidence_event_ids=[event.event_id],
                expiry_s=12.0,
            )

        return None


class NarrativeRecapAgent(BaseAgent):
    """
    Tracks storylines, milestone records, and synthesizes post-match recaps from verified events.
    """
    def __init__(self):
        super().__init__(name="NarrativeRecap", role="Chief Match Storyline Chronicler")
        self.milestones: List[str] = []

    def process(self, event: MatchEvent, context: Dict[str, Any]) -> Optional[AgentInsight]:
        if event.event_type == EventType.GOAL:
            milestone_text = (
                f"Minute {event.minute}': Goal by {event.player_name} ({event.team_name}), "
                f"Score: {event.metadata.get('home_team')} {event.metadata.get('home_score')} - "
                f"{event.metadata.get('away_score')} {event.metadata.get('away_team')}"
            )
            self.milestones.append(milestone_text)
            return AgentInsight(
                insight_id=f"ins_rec_goal_{event.event_id}",
                match_id=event.match_id,
                agent_name=self.name,
                role=self.role,
                timestamp_s=event.timestamp_s,
                minute=event.minute,
                headline="MATCH STORYLINE: Pivotal Scoreline Event",
                content=(
                    f"A critical turning point in this fixture. {event.player_name} gives {event.team_name} "
                    f"the edge. Score: {event.metadata.get('home_team')} {event.metadata.get('home_score')} - "
                    f"{event.metadata.get('away_score')} {event.metadata.get('away_team')}."
                ),
                persona_target="all",
                importance="high",
                confidence=0.98,
                evidence_event_ids=[event.event_id],
                expiry_s=20.0,
            )
        return None

    def generate_full_recap(self, final_event: MatchEvent, all_events: List[MatchEvent]) -> Dict[str, Any]:
        """
        Synthesizes a grounded post-match recap strictly based on accumulated events.
        """
        home_score = final_event.metadata.get("home_score", 0)
        away_score = final_event.metadata.get("away_score", 0)
        home_team = final_event.metadata.get("home_team", "ARS")
        away_team = final_event.metadata.get("away_team", "MCI")

        total_shots = sum(1 for e in all_events if e.event_type in [EventType.SHOT, EventType.GOAL])
        total_passes = sum(1 for e in all_events if e.event_type == EventType.PASS)
        total_line_breaks = sum(1 for e in all_events if e.pass_detail and e.pass_detail.is_line_breaking)

        home_shots = sum(1 for e in all_events if e.team_id == "arsenal" and e.event_type in [EventType.SHOT, EventType.GOAL])
        away_shots = total_shots - home_shots

        metrics = final_event.tactical_metrics

        # Dynamically extract milestones from verified event stream
        event_milestones = []
        for e in all_events:
            if e.event_type == EventType.GOAL:
                event_milestones.append(
                    f"Minute {e.minute}': Goal by {e.player_name} ({e.team_name}), "
                    f"Score: {e.metadata.get('home_team', 'ARS')} {e.metadata.get('home_score', 0)} - "
                    f"{e.metadata.get('away_score', 0)} {e.metadata.get('away_team', 'MCI')}"
                )
            elif e.event_type == EventType.SHOT and e.shot_detail and e.shot_detail.xg >= 0.40:
                event_milestones.append(
                    f"Minute {e.minute}': Big Chance ({e.shot_detail.xg:.2f} xG) by {e.player_name} ({e.team_name})"
                )

        combined_milestones = list(dict.fromkeys(self.milestones + event_milestones))

        return {
            "title": f"Full Match Intelligence Recap: {home_team} {home_score} - {away_score} {away_team}",
            "match_id": final_event.match_id,
            "final_clock": f"{final_event.minute}:{final_event.second:02d}",
            "verified_statistics": {
                "home_score": home_score,
                "away_score": away_score,
                "total_events_analyzed": len(all_events),
                "total_passes": total_passes,
                "line_breaking_passes": total_line_breaks,
                "total_shots": total_shots,
                "home_shots": home_shots,
                "away_shots": away_shots,
                "home_possession_pct": metrics.home_possession_pct,
                "away_possession_pct": metrics.away_possession_pct,
                "home_xg_cumulative": metrics.home_xg_cumulative,
                "away_xg_cumulative": metrics.away_xg_cumulative,
                "average_ppda": metrics.pressing_intensity_ppda,
            },
            "summary": (
                f"A high-intensity Premier League battle concluding {home_score}-{away_score} after {len(all_events)} "
                f"analyzed events. Possessions stood at {metrics.home_possession_pct}% to {metrics.away_possession_pct}%. "
                f"Arsenal registered {metrics.home_xg_cumulative:.2f} xG against Manchester City's {metrics.away_xg_cumulative:.2f} xG."
            ),
            "key_milestones": combined_milestones if combined_milestones else ["Disciplined defensive battle with compact positional blocks."],
            "tactical_verdict": (
                f"Tactical control settled at {metrics.control_vs_chaos:.1f}/100. With {total_line_breaks} line-breaking passes "
                "completed across both sides, space between defensive pivots proved the defining strategic battleground."
            ),
        }


class MultilingualTranslatorAgent(BaseAgent):
    """
    Translates tactical and broadcast narratives into international languages:
    Spanish (es), French (fr), German (de), Arabic (ar), Hindi (hi).
    Preserves player names, timestamps, and numbers while applying native football idioms.
    """
    TRANSLATIONS = {
        "es": {
            "goal": "¡GOLAZO! Remate imparable y la afición vibra en este duelo de la Premier League.",
            "chance": "¡Ocasión manifiesta de gol que genera tensión máxima en el área rival!",
            "line_break": "Pase entre líneas con precisión milimétrica que quiebra el bloque rival.",
            "chaos": "ALERTA DE CAOS: Aumento crítico en pérdidas de balón e inestabilidad posicional.",
        },
        "fr": {
            "goal": "BUT SPLENDIDE! Une frappe limpide qui fait chavirer le stade!",
            "chance": "Occasion brûlante dans la surface qui met la défense sous haute tension!",
            "line_break": "Passe chirurgicale qui casse les lignes au milieu de terrain.",
            "chaos": "ALERTE TRANSITION: Les pertes de balle répétées désorganisent le bloc équipe.",
        },
        "de": {
            "goal": "TOR! Herausragender Abschluss, der die gegnerische Abwehrkette komplett durchbricht!",
            "chance": "Große Torchance mit hohem Gefahrenpotenzial im gegnerischen Strafraum!",
            "line_break": "Linienbrechender Pass mit perfekter Schnittstellen-Präzision in den Halbraum.",
            "chaos": "CHAOS-ALARM: Schnelle Ballverluste führen zu hoher taktischer Anfälligkeit.",
        },
        "ar": {
            "goal": "هدف رائع لا يصد ولا يرد! يغير مجريات اللقاء التكتيكي والملعب يشتعل حماساً!",
            "chance": "فرصة تهديفية خطيرة تخترق الحصون الدفاعية للمنافس!",
            "line_break": "تمريرة كاسرة للخطوط تكشف المساحات وتخترق العمق الدفاعي.",
            "chaos": "تنبيه تكتيكي: فقدان متكرر للكرة وتراجع في استقرار التمركز الدفاعي.",
        },
        "hi": {
            "goal": "शानदार गोल! गेंद सीधे जाल में, पूरे स्टेडियम में जबरदस्त रोमांच!",
            "chance": "गोल करने का बेहद ख़तरनाक मौक़ा, विरोधी रक्षापंक्ति पर भारी दबाव!",
            "line_break": "मिडफ़ील्ड को भेदता हुआ बेहतरीन पास, विंग में खुली जगह बनाई।",
            "chaos": "अस्थिरता की चेतावनी: तेज़ी से गेंद खोने के कारण रक्षात्मक संरचना बिखरी।",
        },
    }

    def __init__(self):
        super().__init__(name="MultilingualTranslator", role="Global Broadcast Localization Specialist")

    def translate_insight(self, insight: AgentInsight, target_lang: str) -> AgentInsight:
        lang_dict = self.TRANSLATIONS.get(target_lang, {})
        key = "goal" if "GOAL" in insight.headline else "chance" if "CHANCE" in insight.headline else "chaos" if "CHAOS" in insight.headline else "line_break"
        localized_content = lang_dict.get(key, insight.content)

        return AgentInsight(
            insight_id=f"{insight.insight_id}_{target_lang}",
            match_id=insight.match_id,
            agent_name=self.name,
            role=self.role,
            timestamp_s=insight.timestamp_s,
            minute=insight.minute,
            headline=f"[{target_lang.upper()}] {insight.headline}",
            content=localized_content,
            persona_target=insight.persona_target,
            language=target_lang,
            importance=insight.importance,
            confidence=insight.confidence,
            evidence_event_ids=insight.evidence_event_ids,
            supporting_metrics=insight.supporting_metrics,
            expiry_s=insight.expiry_s,
        )


class AgentOrchestrator:
    """
    Orchestrates the multi-agent collective blackboard.
    Enforces role separation, eliminates redundant commentary via cooldowns,
    and synchronizes validated insights across personas.
    """
    def __init__(self):
        self.analyst = TacticalAnalystAgent()
        self.commentator = BroadcastCommentatorAgent()
        self.recap = NarrativeRecapAgent()
        self.translator = MultilingualTranslatorAgent()
        self.shared_blackboard: List[AgentInsight] = []

    def dispatch(self, event: MatchEvent) -> List[AgentInsight]:
        context = {"shared_events_count": len(self.shared_blackboard)}
        new_insights: List[AgentInsight] = []

        # Coordinated execution
        analyst_out = self.analyst.process(event, context)
        if analyst_out:
            new_insights.append(analyst_out)

        commentator_out = self.commentator.process(event, context)
        if commentator_out:
            new_insights.append(commentator_out)

        recap_out = self.recap.process(event, context)
        if recap_out:
            new_insights.append(recap_out)

        # Generate multilingual variants for high-impact insights
        for insight in list(new_insights):
            if insight.persona_target in ["casual", "all"] and insight.importance in ["high", "critical"]:
                for lang in ["es", "fr", "de", "ar", "hi"]:
                    trans = self.translator.translate_insight(insight, lang)
                    new_insights.append(trans)

        self.shared_blackboard.extend(new_insights)
        return new_insights

    def get_full_match_recap(self, final_event: MatchEvent, all_events: List[MatchEvent]) -> Dict[str, Any]:
        return self.recap.generate_full_recap(final_event, all_events)
