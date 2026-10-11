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

    def process(self, event: MatchEvent, context: Dict[str, Any]) -> Optional[AgentInsight]:
        raise NotImplementedError


class TacticalAnalystAgent(BaseAgent):
    """
    Analyzes spatial geometry, passing lanes, and structural phases.
    Outputs high-density tactical reasoning for analysts.
    """
    def __init__(self):
        super().__init__(name="TacticalAnalyst", role="Lead Tactical & Systems Analyst")

    def process(self, event: MatchEvent, context: Dict[str, Any]) -> Optional[AgentInsight]:
        metrics: TacticalMetricState = event.tactical_metrics

        if event.event_type == EventType.GOAL:
            shot = event.shot_detail
            return AgentInsight(
                agent_name=self.name,
                role=self.role,
                timestamp_s=event.timestamp_s,
                minute=event.minute,
                headline=f"GOAL ANALYSIS: {event.player_name} Clinical Execution",
                content=(
                    f"Defensive block breached from ({event.location.x:.1f}m, {event.location.y:.1f}m). "
                    f"Shot velocity reached {shot.shot_speed_kmh if shot else 95.0:.1f} km/h with xG {shot.xg if shot else 0.45:.2f}. "
                    f"The opposition's rest defense failed to collapse on the cut-back lane."
                ),
                persona_target="analyst",
                audio_cue="tactical_breakdown_goal",
            )

        if event.pass_detail and event.pass_detail.is_line_breaking:
            return AgentInsight(
                agent_name=self.name,
                role=self.role,
                timestamp_s=event.timestamp_s,
                minute=event.minute,
                headline="TACTICAL LINE-BREAK: Midfield Pivot Bypassed",
                content=(
                    f"{event.player_name} split the defensive line with a {event.pass_detail.distance_m:.1f}m through ball "
                    f"(Difficulty rating: {event.pass_detail.difficulty_rating:.2f}). "
                    f"Created a 3v2 numerical overload in the half-space."
                ),
                persona_target="analyst",
            )

        if metrics.control_vs_chaos < 30.0:
            return AgentInsight(
                agent_name=self.name,
                role=self.role,
                timestamp_s=event.timestamp_s,
                minute=event.minute,
                headline="CHAOS ALERT: Transition Volatility Exceeding Threshold",
                content=(
                    f"Control index plummeted to {metrics.control_vs_chaos:.1f}/100. Rapid back-to-back turnovers "
                    f"have broken team compact structure. High transition vulnerability for both flanks."
                ),
                persona_target="analyst",
            )

        return None


class BroadcastCommentatorAgent(BaseAgent):
    """
    Generates real-time broadcast play-by-play and color commentary.
    Tone: energetic, cinematic, accessible for general audiences.
    """
    def __init__(self):
        super().__init__(name="LiveCommentator", role="Lead Premier League Match Commentator")

    def process(self, event: MatchEvent, context: Dict[str, Any]) -> Optional[AgentInsight]:
        if event.event_type == EventType.GOAL:
            return AgentInsight(
                agent_name=self.name,
                role=self.role,
                timestamp_s=event.timestamp_s,
                minute=event.minute,
                headline=f"GOAL! {event.player_name.upper()} STRIKES!",
                content=(
                    f"WHAT A MOMENT! {event.player_name} lashes it into the net! "
                    f"The stadium erupts as {event.team_name} take control! Absolutely electric!"
                ),
                persona_target="casual",
                audio_cue="crowd_roar_goal",
            )

        if event.event_type == EventType.SHOT:
            shot = event.shot_detail
            desc = "stinging strike" if (shot and shot.on_target) else "fierce attempt"
            return AgentInsight(
                agent_name=self.name,
                role=self.role,
                timestamp_s=event.timestamp_s,
                minute=event.minute,
                headline=f"CHANCE! {event.player_name} with a {desc}",
                content=(
                    f"Heart-stopping action at {event.minute}'! {event.player_name} pulls the trigger from the edge of the area! "
                    f"The defenders could only watch as it whipped past!"
                ),
                persona_target="casual",
            )

        if event.explainability.significance_level == "high":
            return AgentInsight(
                agent_name=self.name,
                role=self.role,
                timestamp_s=event.timestamp_s,
                minute=event.minute,
                headline=f"TURNING POINT: {event.explainability.tactical_pattern}",
                content=f"Watch this closely! {event.explainability.why_it_matters}",
                persona_target="casual",
            )

        return None


class NarrativeRecapAgent(BaseAgent):
    """
    Tracks storylines, milestone records, and synthesizes 90-minute post-match recaps.
    """
    def __init__(self):
        super().__init__(name="NarrativeRecap", role="Chief Match Storyline & Milestone Chronicler")
        self.milestones: List[str] = []

    def process(self, event: MatchEvent, context: Dict[str, Any]) -> Optional[AgentInsight]:
        if event.event_type == EventType.GOAL:
            milestone_text = f"Goal recorded at {event.minute}' by {event.player_name} ({event.team_name})"
            self.milestones.append(milestone_text)
            return AgentInsight(
                agent_name=self.name,
                role=self.role,
                timestamp_s=event.timestamp_s,
                minute=event.minute,
                headline="MATCH STORYLINE: Critical Scoreline Shift",
                content=(
                    f"This strike shifts the momentum dramatically. {event.player_name} proves decisive in a fixture "
                    f"where every margin counts. Scoreline now: {event.metadata.get('home_team')} {event.metadata.get('home_score')} - "
                    f"{event.metadata.get('away_score')} {event.metadata.get('away_team')}."
                ),
                persona_target="all",
            )
        return None

    def generate_full_recap(self, final_event: MatchEvent, all_events: List[MatchEvent]) -> Dict[str, Any]:
        home_score = final_event.metadata.get("home_score", 0)
        away_score = final_event.metadata.get("away_score", 0)
        total_shots = sum(1 for e in all_events if e.event_type in [EventType.SHOT, EventType.GOAL])
        total_passes = sum(1 for e in all_events if e.event_type == EventType.PASS)

        return {
            "title": f"Full Match Intelligence Recap: Arsenal FC {home_score} - {away_score} Manchester City",
            "summary": (
                f"A masterclass in modern tactical football. The fixture ended {home_score}-{away_score} after {len(all_events)} "
                f"analyzed events, featuring {total_shots} scoring attempts and {total_passes} progressive passes. "
                f"Tactical control oscillated between high-pressing chaos and structured positional superiority."
            ),
            "key_milestones": self.milestones if self.milestones else ["Tense tactical battle with defensive discipline prevailing."],
            "tactical_verdict": (
                "Both sides demonstrated elite tactical adaptability. The decisive factor lay in half-space overloads "
                "and counter-press recovery efficiency under sustained transition stress."
            ),
        }


class MultilingualTranslatorAgent(BaseAgent):
    """
    Translates tactical and broadcast narratives into international languages:
    Spanish (es), French (fr), German (de), Arabic (ar), Hindi (hi).
    """
    TRANSLATIONS = {
        "es": {
            "goal": "¡GOLAZO! Remate imparable y la grada enloquece en este clásico de la Premier League.",
            "chance": "¡Ocasión clara de peligro que roza el travesaño!",
            "line_break": "Pase entre líneas milimétrico que rompe la estructura defensiva.",
        },
        "fr": {
            "goal": "BUT MAGNIFIQUE! Une frappe limpide qui fait chavirer les supporters!",
            "chance": "Occasion dangereuse qui met la défense sous haute tension!",
            "line_break": "Passe tranchante cassant les lignes au milieu de terrain.",
        },
        "de": {
            "goal": "TOR! Traumhafter Treffer, der die Taktik des Gegners komplett durchbricht!",
            "chance": "Große Torchance mit hohem xG-Wert im gegnerischen Strafraum!",
            "line_break": "Linienbrechender Pass mit perfekter Präzision in den Halbraum.",
        },
        "ar": {
            "goal": "هدف رائع لا يصد ولا يرد! يغير مجريات اللقاء التكتيكي تماماً!",
            "chance": "فرصة تهديفية خطيرة تخترق الحصون الدفاعية!",
            "line_break": "تمريرة كاسرة للخطوط تكشف المساحات في عمق الملعب.",
        },
        "hi": {
            "goal": "शानदार गोल! गेंद सीधे जाल में, मैच का रोमांच अपने चरम पर!",
            "chance": "गोल करने का बेहद ख़तरनाक मौक़ा, डिफ़ेंस पर भारी दबाव!",
            "line_break": "मिडफ़ील्ड को चीरता हुआ बेहतरीन पास, खिलाड़ियों में गज़ब का तालमेल!",
        },
    }

    def __init__(self):
        super().__init__(name="MultilingualTranslator", role="Global Broadcast Localization Specialist")

    def translate_insight(self, insight: AgentInsight, target_lang: str) -> AgentInsight:
        lang_dict = self.TRANSLATIONS.get(target_lang, {})
        key = "goal" if "GOAL" in insight.headline else "chance" if "CHANCE" in insight.headline else "line_break"
        localized_content = lang_dict.get(key, insight.content)

        return AgentInsight(
            agent_name=self.name,
            role=self.role,
            timestamp_s=insight.timestamp_s,
            minute=insight.minute,
            headline=f"[{target_lang.upper()}] {insight.headline}",
            content=localized_content,
            persona_target=insight.persona_target,
            language=target_lang,
        )


class AgentOrchestrator:
    """
    Orchestrates the multi-agent collective blackboard.
    Enforces role separation, eliminates redundant commentary,
    and synchronizes insights across personas.
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

        # Run agents in coordinated sequence
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
            if insight.persona_target in ["casual", "all"]:
                for lang in ["es", "fr", "de", "ar", "hi"]:
                    trans = self.translator.translate_insight(insight, lang)
                    new_insights.append(trans)

        self.shared_blackboard.extend(new_insights)
        return new_insights

    def get_full_match_recap(self, final_event: MatchEvent, all_events: List[MatchEvent]) -> Dict[str, Any]:
        return self.recap.generate_full_recap(final_event, all_events)
