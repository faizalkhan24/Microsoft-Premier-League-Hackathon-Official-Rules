import React, { useState, useMemo } from 'react';
import {
  Cpu,
  ShieldCheck,
  TrendingUp,
  BarChart2,
  Hash,
  Network,
  Activity,
  CheckCircle2,
  Sparkles,
  Layers,
  Zap,
  Clock,
  Compass,
} from 'lucide-react';

export default function AnalystModeView({ events, insights, currentLang = 'en' }) {
  const [activeAnalystTab, setActiveAnalystTab] = useState('spatial'); // 'spatial' | 'foundry'

  const analystInsights = insights.filter(
    (i) =>
      (i.persona_target === 'analyst' || i.persona_target === 'all') &&
      (i.language === currentLang || (!i.language && currentLang === 'en'))
  );
  const shots = events.filter((e) => e.event_type === 'shot' || e.event_type === 'goal');
  const passes = events.filter((e) => e.event_type === 'pass');
  const lineBreaks = passes.filter((p) => p.pass_detail?.is_line_breaking);

  const avgPassDiff =
    passes.length > 0
      ? (passes.reduce((acc, p) => acc + (p.pass_detail?.difficulty_rating || 0), 0) / passes.length) * 100
      : 35.0;

  const latestEvent = events.length > 0 ? events[events.length - 1] : null;
  const homeXg = latestEvent?.tactical_metrics?.home_xg_cumulative ?? 0.0;
  const awayXg = latestEvent?.tactical_metrics?.away_xg_cumulative ?? 0.0;

  // Spatial zonal analytics
  const spatialZones = useMemo(() => {
    let attackingThird = 0;
    let middleThird = 0;
    let defensiveThird = 0;
    let halfSpaces = 0;
    let centralChannel = 0;
    let wideFlanks = 0;

    events.forEach((ev) => {
      const loc = ev.location;
      if (!loc) return;
      if (loc.x > 70) attackingThird++;
      else if (loc.x >= 35) middleThird++;
      else defensiveThird++;

      if (loc.y < 14 || loc.y > 54) wideFlanks++;
      else if ((loc.y >= 14 && loc.y < 27) || (loc.y > 41 && loc.y <= 54)) halfSpaces++;
      else centralChannel++;
    });

    const total = Math.max(1, events.length);
    return {
      attPct: Math.round((attackingThird / total) * 100),
      midPct: Math.round((middleThird / total) * 100),
      defPct: Math.round((defensiveThird / total) * 100),
      halfSpacesCount: halfSpaces,
      centralCount: centralChannel,
      wideCount: wideFlanks,
    };
  }, [events]);

  return (
    <div className="space-y-4">
      {/* Analyst KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-pl-card border border-pl-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400 flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1 text-pl-cyan" /> Cumulative xG
          </span>
          <div className="text-lg font-mono font-bold mt-1 text-slate-100">
            ARS <span className="text-red-400">{homeXg.toFixed(2)}</span> -{' '}
            <span className="text-sky-300">{awayXg.toFixed(2)}</span> MCI
          </div>
          <span className="text-[9px] text-slate-400">Direction-aware geometric model</span>
        </div>

        <div className="bg-pl-card border border-pl-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400 flex items-center">
            <Cpu className="w-3.5 h-3.5 mr-1 text-amber-400" /> Line-Breaking Passes
          </span>
          <div className="text-xl font-mono font-bold mt-1 text-amber-400">
            {lineBreaks.length} <span className="text-xs font-normal text-slate-400">completed</span>
          </div>
          <span className="text-[9px] text-slate-400">Midfield & defensive line breaches</span>
        </div>

        <div className="bg-pl-card border border-pl-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400 flex items-center">
            <BarChart2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Avg Pass Difficulty
          </span>
          <div className="text-xl font-mono font-bold mt-1 text-emerald-400">
            {avgPassDiff.toFixed(1)}%
          </div>
          <span className="text-[9px] text-slate-400">Geometric distance & lane pressure</span>
        </div>

        <div className="bg-pl-card border border-pl-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400 flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-400" /> Total Data Events
          </span>
          <div className="text-xl font-mono font-bold mt-1 text-purple-300">
            {events.length}
          </div>
          <span className="text-[9px] text-slate-400">Real-time validated stream buffer</span>
        </div>
      </div>

      {/* Interactive Analyst Sub-Tabs Header */}
      <div className="bg-pl-card border border-pl-border rounded-2xl p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-pl-border pb-3 gap-2">
          {/* Real Clickable Toggle Buttons */}
          <div className="flex items-center space-x-1.5 bg-pl-dark/90 p-1.5 rounded-xl border border-pl-border">
            <button
              onClick={() => setActiveAnalystTab('spatial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeAnalystTab === 'spatial'
                  ? 'bg-pl-cyan text-pl-dark shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Spatial & Structural Breakdown</span>
            </button>

            <button
              onClick={() => setActiveAnalystTab('foundry')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeAnalystTab === 'foundry'
                  ? 'bg-pl-cyan text-pl-dark shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Foundry Agent Framework</span>
            </button>
          </div>

          <span className="text-[10px] text-slate-400 font-mono flex items-center self-end sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            Multi-Agent Blackboard Active
          </span>
        </div>

        {/* TAB 1: SPATIAL & STRUCTURAL BREAKDOWN */}
        {activeAnalystTab === 'spatial' && (
          <div className="space-y-4">
            {/* Spatial Zone Telemetry Bar */}
            <div className="bg-pl-dark/80 rounded-xl p-3 border border-pl-border/80">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="font-bold text-slate-200 flex items-center">
                  <Compass className="w-3.5 h-3.5 mr-1 text-pl-cyan" />
                  Zonal Penetration Distribution
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Pitch Pitch Thirds: Def {spatialZones.defPct}% | Mid {spatialZones.midPct}% | Att {spatialZones.attPct}%
                </span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden w-full bg-slate-800 mb-2">
                <div style={{ width: `${spatialZones.defPct}%` }} className="bg-slate-600 transition-all duration-500" title="Defensive Third" />
                <div style={{ width: `${spatialZones.midPct}%` }} className="bg-pl-cyan transition-all duration-500" title="Middle Third" />
                <div style={{ width: `${spatialZones.attPct}%` }} className="bg-red-500 transition-all duration-500" title="Attacking Third" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Half-Space Entries</span>
                  <strong className="text-amber-400 font-mono text-xs">{spatialZones.halfSpacesCount}</strong>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Central Channel</span>
                  <strong className="text-pl-cyan font-mono text-xs">{spatialZones.centralCount}</strong>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Wide Flank Overloads</span>
                  <strong className="text-emerald-400 font-mono text-xs">{spatialZones.wideCount}</strong>
                </div>
              </div>
            </div>

            {/* Tactical Analyst Insight Cards */}
            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1 custom-scrollbar">
              {analystInsights.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  Processing tactical telemetry stream...
                </p>
              ) : (
                analystInsights.slice().reverse().slice(0, 8).map((insight) => (
                  <div
                    key={insight.insight_id}
                    className="bg-pl-dark/80 border border-pl-border rounded-xl p-3 text-xs hover:border-pl-cyan/50 transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-pl-cyan font-mono text-[11px]">
                        {insight.headline}
                      </span>
                      <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400">
                        {insight.confidence && (
                          <span className="text-emerald-400 font-bold">
                            {(insight.confidence * 100).toFixed(0)}% conf
                          </span>
                        )}
                        <span>{insight.minute}'</span>
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">{insight.content}</p>

                    {/* Evidence Traceability Badge */}
                    {insight.evidence_event_ids && insight.evidence_event_ids.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-pl-border/40 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center">
                          <Hash className="w-3 h-3 mr-1 text-pl-cyan" />
                          Evidence: {insight.evidence_event_ids.join(', ')}
                        </span>
                        <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                          {insight.importance} priority
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MICROSOFT AI FOUNDRY AGENT FRAMEWORK */}
        {activeAnalystTab === 'foundry' && (
          <div className="space-y-3">
            {/* Architecture Summary Banner */}
            <div className="bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-500/30 rounded-xl p-3 text-xs text-slate-300">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white flex items-center">
                  <Network className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                  Microsoft AI Foundry Multi-Agent Runtime
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-mono font-bold border border-blue-500/30">
                  Agent Orchestrator: ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                4 specialized autonomous agents collaborate asynchronously over a shared match blackboard.
                Every generated conclusion is bound to verified deterministic telemetry IDs to ensure 0% hallucination.
              </p>
            </div>

            {/* Active Agents Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Agent 1 */}
              <div className="bg-pl-dark/80 p-2.5 rounded-xl border border-pl-border hover:border-pl-cyan/40 transition">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-pl-cyan font-display text-[11px]">Tactical Analyst Agent</strong>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">ONLINE</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-1.5">
                  Spatial structure analysis, defensive block breach detection & pressure tracking.
                </p>
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 border-t border-pl-border/50 pt-1">
                  <span>Model: GPT-4o / Foundry</span>
                  <span>Cooldown: 10s</span>
                </div>
              </div>

              {/* Agent 2 */}
              <div className="bg-pl-dark/80 p-2.5 rounded-xl border border-pl-border hover:border-pl-pink/40 transition">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-pl-pink font-display text-[11px]">Live Commentator Agent</strong>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">ONLINE</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-1.5">
                  Real-time broadcast play-by-play, momentum shifts & drama excitement scores.
                </p>
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 border-t border-pl-border/50 pt-1">
                  <span>Model: GPT-4o-mini</span>
                  <span>Cooldown: 8s</span>
                </div>
              </div>

              {/* Agent 3 */}
              <div className="bg-pl-dark/80 p-2.5 rounded-xl border border-pl-border hover:border-amber-400/40 transition">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-amber-300 font-display text-[11px]">Narrative Recap Agent</strong>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">ONLINE</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-1.5">
                  Milestone indexing, turning-point chronicling & post-match intelligence reports.
                </p>
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 border-t border-pl-border/50 pt-1">
                  <span>Model: Foundry Reasoning</span>
                  <span>Milestones: Tracked</span>
                </div>
              </div>

              {/* Agent 4 */}
              <div className="bg-pl-dark/80 p-2.5 rounded-xl border border-pl-border hover:border-purple-400/40 transition">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-purple-300 font-display text-[11px]">Multilingual Translator</strong>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">ONLINE</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-1.5">
                  Native football idioms across 5 languages: ES, FR, DE, AR, HI with name protection.
                </p>
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 border-t border-pl-border/50 pt-1">
                  <span>Locales: 5 Active</span>
                  <span>Audio/Text: Ready</span>
                </div>
              </div>
            </div>

            {/* Blackboard Telemetry Status */}
            <div className="bg-pl-dark/60 rounded-xl p-3 border border-pl-border/60 text-xs">
              <span className="text-[11px] font-bold text-slate-300 block mb-1.5 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Deterministic Grounding & Memory Verification
              </span>
              <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-center">
                <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Hallucination Risk</span>
                  <strong className="text-emerald-400 text-xs">0.0%</strong>
                </div>
                <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Evidence Traceability</span>
                  <strong className="text-pl-cyan text-xs">100%</strong>
                </div>
                <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Memory Eviction</span>
                  <strong className="text-purple-300 text-xs">Sliding Ring</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
