import React from 'react';
import {
  Activity,
  Gauge,
  Flame,
  Radio,
  PieChart,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';

export default function BroadcastHUD({
  score,
  clock,
  metrics,
  homeTeam,
  awayTeam,
  isConnected,
  isPaused = false,
  onTogglePause,
  playbackSpeed = 1.0,
  onChangeSpeed,
  isAudioEnabled = false,
  onToggleAudio,
  isSpeaking = false,
}) {
  const control = metrics?.control_vs_chaos ?? 65;
  const homeMom = metrics?.home_momentum ?? 50;
  const awayMom = metrics?.away_momentum ?? 50;
  const totalMom = Math.max(1, homeMom + awayMom);
  const homeMomPct = Math.round((homeMom / totalMom) * 100);
  const awayMomPct = 100 - homeMomPct;
  const homePoss = metrics?.home_possession_pct ?? 50;
  const awayPoss = metrics?.away_possession_pct ?? 50;
  const ppda = metrics?.pressing_intensity_ppda ?? 8.5;
  const homeXg = metrics?.home_xg_cumulative ?? 0.0;
  const awayXg = metrics?.away_xg_cumulative ?? 0.0;

  return (
    <div className="w-full bg-pl-card border border-pl-border rounded-2xl p-4 shadow-xl mb-4">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* TV Broadcast Scorebug with Interactive Playback Controls */}
        <div className="flex items-center space-x-3 bg-pl-dark/90 px-4 py-2.5 rounded-xl border border-pl-border/80 shadow-inner flex-wrap gap-y-2">
          {/* Premier League Brand */}
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-pl-pink"></span>
            <span className="font-extrabold text-sm tracking-wider text-slate-200">PREMIER LEAGUE</span>
          </div>

          <div className="h-5 w-[1px] bg-slate-700 hidden sm:block"></div>

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

          <div className="h-5 w-[1px] bg-slate-700 hidden sm:block"></div>

          {/* Match Clock & Phase */}
          <div className="flex items-center space-x-1.5 font-mono text-sm">
            <span className="text-pl-cyan font-bold">
              {clock?.minute ?? 0}:{String(clock?.second ?? 0).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-sans font-semibold">
              {clock?.phase || '1H'}
            </span>
          </div>

          <div className="h-5 w-[1px] bg-slate-700 hidden sm:block"></div>

          {/* Interactive Play/Pause & Speed Controller */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={onTogglePause}
              className={`p-1.5 rounded-lg border transition flex items-center justify-center ${
                isPaused
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 shadow-md animate-pulse'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
              }`}
              title={isPaused ? 'Resume Match Stream (Space / Click)' : 'Pause Match Stream'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            {/* Speed Selector Pills */}
            <div className="flex items-center space-x-0.5 bg-slate-900/90 p-0.5 rounded-lg border border-slate-700 text-[10px] font-mono">
              {[0.5, 1.0, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed && onChangeSpeed(s)}
                  className={`px-1.5 py-0.5 rounded font-bold transition ${
                    playbackSpeed === s ? 'bg-pl-cyan text-pl-dark font-extrabold shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title={`Set Simulation Speed to ${s}x`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Live Audio Commentary (Text-to-Speech) Toggle */}
            <button
              onClick={onToggleAudio}
              className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition flex items-center space-x-1 ${
                isAudioEnabled
                  ? 'bg-gradient-to-r from-pl-pink to-purple-600 text-white border-pink-400/80 shadow-md shadow-pink-500/20'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title={isAudioEnabled ? 'Disable Live Voice Commentary' : 'Enable Live AI Audio Commentary (Web Speech)'}
            >
              {isAudioEnabled ? (
                <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce text-white' : ''}`} />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline font-mono">
                {isAudioEnabled ? (isSpeaking ? 'VOICE ON (AUDIO)' : 'VOICE ON') : 'VOICE OFF'}
              </span>
            </button>
          </div>

          <div className="flex items-center pl-1">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-pl-cyan animate-pulse' : 'text-slate-500'}`} />
          </div>
        </div>

        {/* Real Tactical Telemetry Ribbon */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
          {/* Control vs Chaos Index */}
          <div className="bg-pl-dark/60 border border-pl-border/50 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center">
                <Gauge className="w-3 h-3 mr-1 text-pl-cyan" /> Control vs Chaos
              </span>
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
              <span className="flex items-center">
                <PieChart className="w-3 h-3 mr-1 text-amber-400" /> Possession Share
              </span>
              <span className="font-mono text-xs text-slate-200">
                {homePoss}% - {awayPoss}%
              </span>
            </div>
            <div className="flex w-full h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-red-500 transition-all duration-500" style={{ width: `${homePoss}%` }} />
              <div className="bg-sky-400 transition-all duration-500" style={{ width: `${awayPoss}%` }} />
            </div>
            <span className="text-[9px] text-slate-400 mt-1">Cumulative pass & action duration</span>
          </div>

          {/* Momentum Tug-of-War */}
          <div className="bg-pl-dark/60 border border-pl-border/50 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center">
                <Flame className="w-3 h-3 mr-1 text-pl-pink" /> Momentum Tug
              </span>
              <span className="font-mono text-xs text-slate-200">
                {homeMomPct}% - {awayMomPct}%
              </span>
            </div>
            <div className="flex w-full h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-red-500 transition-all duration-500" style={{ width: `${homeMomPct}%` }} />
              <div className="bg-sky-400 transition-all duration-500" style={{ width: `${awayMomPct}%` }} />
            </div>
            <span className="text-[9px] text-slate-400 mt-1">
              {homeMomPct > 55
                ? `${homeTeam?.short_name || 'ARS'} in ascendancy`
                : awayMomPct > 55
                ? `${awayTeam?.short_name || 'MCI'} pressing forward`
                : 'Evenly contested flow'}
            </span>
          </div>

          {/* Pressing PPDA */}
          <div className="bg-pl-dark/60 border border-pl-border/50 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center">
                <Activity className="w-3 h-3 mr-1 text-emerald-400" /> Pressing (PPDA)
              </span>
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
              <span className="font-mono font-bold text-pl-yellow">
                {homeXg.toFixed(2)} vs {awayXg.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-pl-yellow h-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, ((homeXg + 0.01) / (homeXg + awayXg + 0.02)) * 100)}%`,
                }}
              />
            </div>
            <span className="text-[9px] text-slate-400 mt-1">Direction-aware geometric shot threat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
