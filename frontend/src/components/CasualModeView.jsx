import React from 'react';
import { Sparkles, MessageSquareQuote, Flame, HelpCircle } from 'lucide-react';

export default function CasualModeView({ currentEvent, insights, currentLang = 'en' }) {
  const casualInsights = insights.filter(
    (i) =>
      (i.persona_target === 'casual' || i.persona_target === 'all') &&
      (i.language === currentLang || (!i.language && currentLang === 'en'))
  );
  const explain = currentEvent?.explainability;

  return (
    <div className="space-y-4">
      {/* "Why It Matters Right Now" Big Visual Card */}
      {explain && (
        <div className="bg-gradient-to-r from-pl-purple/90 to-[#22072e] border-2 border-pl-cyan/40 rounded-2xl p-4 shadow-xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-pl-cyan/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center text-xs font-bold text-pl-cyan uppercase tracking-wider">
              <Sparkles className="w-4 h-4 mr-1.5" /> What You Need To Know
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              explain.significance_level === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              explain.significance_level === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-slate-700/50 text-slate-300'
            }`}>
              {explain.significance_level} impact
            </span>
          </div>

          <h3 className="text-base font-bold text-white font-display mb-1">
            {explain.tactical_pattern}
          </h3>

          <div className="bg-pl-dark/70 rounded-xl p-3 border border-pl-border/60 text-xs text-slate-200 leading-relaxed flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 text-pl-cyan flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-pl-cyan block mb-0.5">Why this matters:</strong>
              {explain.why_it_matters}
            </div>
          </div>
        </div>
      )}

      {/* Live Commentator Color Commentary Feed */}
      <div className="bg-pl-card border border-pl-border rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3 border-b border-pl-border pb-2">
          <div className="flex items-center space-x-2">
            <MessageSquareQuote className="w-4 h-4 text-pl-pink" />
            <span className="text-xs font-bold text-slate-200">LIVE BROADCAST COMMENTARY</span>
          </div>
          <span className="text-[10px] text-pl-cyan font-mono flex items-center">
            <Flame className="w-3 h-3 mr-1 text-pl-pink" /> Play-by-Play Energy
          </span>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {casualInsights.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">Awaiting commentator reaction...</p>
          ) : (
            casualInsights.slice().reverse().slice(0, 6).map((insight, idx) => (
              <div key={idx} className="bg-pl-dark/80 border border-pl-border/80 rounded-xl p-3 text-xs hover:border-pl-pink/50 transition">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-pl-pink text-[11px] font-display">{insight.headline}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{insight.minute}'</span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed italic">"{insight.content}"</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
