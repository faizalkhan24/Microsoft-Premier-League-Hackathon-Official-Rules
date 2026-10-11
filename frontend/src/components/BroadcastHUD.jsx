import React from 'react';
import { Activity, Gauge, Flame, Radio, PieChart } from 'lucide-react';

export default function BroadcastHUD({ score, clock, metrics, homeTeam, awayTeam, isConnected }) {
  const control = metrics?.control_vs_chaos ?? 65;
  const homeMom = metrics?.home_momentum ?? 50;
  const awayMom = metrics?.away_momentum ?? 50;
  const homePoss = metrics?.home_possession_pct ?? 50;
  const awayPoss = metrics?.away_possession_pct ?? 50;
  const ppda = metrics?.pressing_intensity_ppda ?? 8.5;
  const tilt = metrics?.field_tilt_pct ?? 52;
  const homeXg = metrics?.home_xg_cumulative ?? 0.0;
  const awayXg = metrics?.away_xg_cumulative ?? 0.0;

  return (
    <div className="w-full bg-pl-card border border-pl-border rounded-2xl p-4 shadow-xl mb-4">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* TV Broadcast Scorebug */}
        <div className="flex items-center space-x-3 bg-pl-dark/80 px-4 py-2.5 rounded-xl border border-pl-border/60 shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-pl-pink"></span>
            <span className="font-extrabold text-sm tracking-wider text-slate-200">PREMIER LEAGUE</span>
          </div>

          <div className="h-5 w-[1px] bg-slate-700"></div>

          {/* Teams & Score */}
          <div className="flex items-center space-x-3 text-base font-bold font-display">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span className="text-white">{homeTeam?.short_name || 'ARS'}</span>
            </div>
            <div className="bg-pl-purple px-2.5 py-0.5 rounded text-pl-cyan text-lg font-mono tracking-wider border border-pl-cyan/20">
              {score?.home ?? 0} - {score?.away ?? 0}
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-white">{awayTeam?.short_name || 'MCI'}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-slate-700"></div>

          {/* Match Clock & Phase */}
          <div className="flex items-center space-x-1.5 font-mono text-sm">
            <span className="text-pl-cyan font-bold">{clock?.minute ?? 0}:{String(clock?.second ?? 0).padStart(2, '0')}</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-sans font-semibold">
              {clock?.phase || '1H'}
            </span>
          </div>

          <div className="flex items-center pl-2">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-pl-cyan animate-pulse' : 'text-slate-500'}`} />
          </div>
        </div>

        {/* Real Tactical Telemetry Ribbon */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          {/* Control vs Chaos Index */}
          <div className="bg-pl-dark/60 border border-pl-border/50 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center"><Gauge className="w-3 h-3 mr-1 text-pl-cyan" /> Control vs Chaos</span>
              <span className="font-mono font-bold text-pl-cyan">{control.toFixed(1)}/100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${control > 50 ? 'bg-pl-cyan' : 'bg-pl-pink'}`}
                style={{ width: `${control}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 mt-1">
              {control > 65 ? 'High Possession Control' : control > 35 ? 'Balanced Equilibrium' : 'Transition Chaos & Flux'}
            </span>
          </div>

          {/* Cumulative Possession % */}
          <div className="bg-pl-dark/60 border border-pl-border/50 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center"><PieChart className="w-3 h-3 mr-1 text-amber-400" /> Possession Share</span>
              <span className="font-mono text-xs text-slate-200">{homePoss}% - {awayPoss}%</span>
            </div>
            <div className="flex w-full h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-red-500 transition-all duration-500" style={{ width: `${homePoss}%` }} />
              <div className="bg-sky-400 transition-all duration-500" style={{ width: `${awayPoss}%` }} />
            </div>
            <span className="text-[9px] text-slate-400 mt-1">
              Cumulative tracked pass/action duration
            </span>
          </div>

          {/* Pressing PPDA */}
          <div className="bg-pl-dark/60 border border-pl-border/50 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center"><Activity className="w-3 h-3 mr-1 text-emerald-400" /> Pressing (PPDA)</span>
              <span className="font-mono font-bold text-emerald-400">{ppda.toFixed(1)}</span>
            </div>
            <div className="text-[10px] text-slate-300 font-semibold mt-1">
              {ppda < 9.0 ? 'Aggressive High-Press' : ppda < 14.0 ? 'Mid-Block Stance' : 'Low-Block Defense'}
            </div>
            <span className="text-[9px] text-slate-400">Passes allowed per defensive tackle</span>
          </div>

          {/* Cumulative xG Quality */}
          <div className="bg-pl-dark/60 border border-pl-border/50 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Cumulative xG</span>
              <span className="font-mono font-bold text-pl-yellow">{homeXg.toFixed(2)} vs {awayXg.toFixed(2)}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-pl-yellow h-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((homeXg + 0.01) / (homeXg + awayXg + 0.02)) * 100)}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 mt-1">Direction-aware geometric shot threat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
