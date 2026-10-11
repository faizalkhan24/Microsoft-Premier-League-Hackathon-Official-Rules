import React from 'react';
import { Cpu, ShieldCheck, TrendingUp, BarChart2, Hash } from 'lucide-react';

export default function AnalystModeView({ events, insights, currentLang = 'en' }) {
  const analystInsights = insights.filter(
    (i) =>
      (i.persona_target === 'analyst' || i.persona_target === 'all') &&
      (i.language === currentLang || (!i.language && currentLang === 'en'))
  );
  const shots = events.filter((e) => e.event_type === 'shot' || e.event_type === 'goal');
  const passes = events.filter((e) => e.event_type === 'pass');
  const lineBreaks = passes.filter((p) => p.pass_detail?.is_line_breaking);

  const avgPassDiff = passes.length > 0
    ? (passes.reduce((acc, p) => acc + (p.pass_detail?.difficulty_rating || 0), 0) / passes.length) * 100
    : 35.0;

  const latestEvent = events.length > 0 ? events[events.length - 1] : null;
  const homeXg = latestEvent?.tactical_metrics?.home_xg_cumulative ?? 0.0;
  const awayXg = latestEvent?.tactical_metrics?.away_xg_cumulative ?? 0.0;

  return (
    <div className="space-y-4">
      {/* Analyst KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-pl-card border border-pl-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400 flex items-center"><TrendingUp className="w-3.5 h-3.5 mr-1 text-pl-cyan" /> Cumulative xG</span>
          <div className="text-lg font-mono font-bold mt-1 text-slate-100">
            ARS <span className="text-red-400">{homeXg.toFixed(2)}</span> - <span className="text-sky-300">{awayXg.toFixed(2)}</span> MCI
          </div>
          <span className="text-[9px] text-slate-400">Direction-aware geometric model</span>
        </div>

        <div className="bg-pl-card border border-pl-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400 flex items-center"><Cpu className="w-3.5 h-3.5 mr-1 text-amber-400" /> Line-Breaking Passes</span>
          <div className="text-xl font-mono font-bold mt-1 text-amber-400">
            {lineBreaks.length} <span className="text-xs font-normal text-slate-400">completed</span>
          </div>
          <span className="text-[9px] text-slate-400">Midfield & defensive line breaches</span>
        </div>

        <div className="bg-pl-card border border-pl-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400 flex items-center"><BarChart2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Avg Pass Difficulty</span>
          <div className="text-xl font-mono font-bold mt-1 text-emerald-400">
            {avgPassDiff.toFixed(1)}%
          </div>
          <span className="text-[9px] text-slate-400">Geometric distance & lane pressure</span>
        </div>

        <div className="bg-pl-card border border-pl-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400 flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-400" /> Total Data Events</span>
          <div className="text-xl font-mono font-bold mt-1 text-purple-300">
            {events.length}
          </div>
          <span className="text-[9px] text-slate-400">Real-time validated stream buffer</span>
        </div>
      </div>

      {/* Deep Tactical Reasoning Stream with Evidence IDs */}
      <div className="bg-pl-card border border-pl-border rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3 border-b border-pl-border pb-2">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pl-cyan/20 text-pl-cyan border border-pl-cyan/30">
              AGENT FEED: TACTICAL ANALYST
            </span>
            <span className="text-xs text-slate-400">Spatial & Structural Breakdown</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Foundry Agent Framework</span>
        </div>

        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
          {analystInsights.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">Processing tactical telemetry stream...</p>
          ) : (
            analystInsights.slice().reverse().slice(0, 8).map((insight) => (
              <div key={insight.insight_id} className="bg-pl-dark/80 border border-pl-border rounded-xl p-3 text-xs hover:border-pl-cyan/50 transition">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-pl-cyan font-mono text-[11px]">{insight.headline}</span>
                  <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400">
                    {insight.confidence && (
                      <span className="text-emerald-400">{(insight.confidence * 100).toFixed(0)}% conf</span>
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
    </div>
  );
}
