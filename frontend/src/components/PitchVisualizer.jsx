import React from 'react';
import { Target, Zap } from 'lucide-react';

export default function PitchVisualizer({ currentEvent, homeTeam, awayTeam }) {
  const loc = currentEvent?.location || { x: 52.5, y: 34.0 };
  const pass = currentEvent?.pass_detail;
  const shot = currentEvent?.shot_detail;
  const isGoal = currentEvent?.event_type === 'goal';
  const isArsenal = currentEvent?.team_id === 'arsenal';

  // SVG viewBox is 0 0 105 68 (standard FIFA / Premier League pitch dimensions)
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-pl-border bg-gradient-to-b from-[#0c2415] to-[#08180e] shadow-2xl p-4">
      {/* Top Header with Event Indicator */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pl-cyan animate-ping"></span>
          <span className="font-mono text-slate-300">PITCH TELEMETRY (105m × 68m)</span>
        </div>
        <div className="flex items-center space-x-3 font-mono text-xs">
          <span className="text-slate-400">X: <strong className="text-pl-cyan">{loc.x.toFixed(1)}m</strong></span>
          <span className="text-slate-400">Y: <strong className="text-pl-cyan">{loc.y.toFixed(1)}m</strong></span>
          {pass && (
            <span className="text-amber-400">
              Pass Diff: <strong>{(pass.difficulty_rating * 100).toFixed(0)}%</strong>
            </span>
          )}
          {shot && (
            <span className="text-rose-400">
              xG: <strong>{shot.xg.toFixed(2)}</strong> | Speed: <strong>{shot.shot_speed_kmh} km/h</strong>
            </span>
          )}
        </div>
      </div>

      {/* Pitch Canvas / SVG */}
      <div className="relative aspect-[105/68] w-full bg-[#143d22] rounded-xl overflow-hidden border-2 border-emerald-900/40 shadow-inner">
        {/* Grass Stripes Pattern */}
        <div className="absolute inset-0 flex opacity-15 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-black' : 'bg-white'}`} />
          ))}
        </div>

        <svg viewBox="0 0 105 68" className="absolute inset-0 w-full h-full stroke-emerald-100/50 fill-none" strokeWidth="0.45">
          {/* Pitch Outer Boundary */}
          <rect x="0.5" y="0.5" width="104" height="67" />

          {/* Halfway Line & Center Circle */}
          <line x1="52.5" y1="0.5" x2="52.5" y2="67.5" />
          <circle cx="52.5" cy="34" r="9.15" />
          <circle cx="52.5" cy="34" r="0.4" className="fill-emerald-100/70" />

          {/* Left Penalty Area (Arsenal Side) */}
          <rect x="0.5" y="13.84" width="16.5" height="40.32" />
          <rect x="0.5" y="24.84" width="5.5" height="18.32" />
          <circle cx="11.0" cy="34" r="0.4" className="fill-emerald-100/70" />
          <path d="M 17.0 27.5 A 9.15 9.15 0 0 1 17.0 40.5" />

          {/* Right Penalty Area (Man City Side) */}
          <rect x="88.0" y="13.84" width="16.5" height="40.32" />
          <rect x="99.0" y="24.84" width="5.5" height="18.32" />
          <circle cx="94.0" cy="34" r="0.4" className="fill-emerald-100/70" />
          <path d="M 88.0 27.5 A 9.15 9.15 0 0 0 88.0 40.5" />

          {/* Goals */}
          <rect x="-1.5" y="30.34" width="2" height="7.32" className="stroke-white/80 fill-white/10" />
          <rect x="104.5" y="30.34" width="2" height="7.32" className="stroke-white/80 fill-white/10" />

          {/* PASS TRAJECTORY LINE */}
          {pass && (
            <g>
              <line
                x1={pass.start_location.x}
                y1={pass.start_location.y}
                x2={pass.end_location.x}
                y2={pass.end_location.y}
                stroke={pass.is_line_breaking ? "#00ff85" : "#f59e0b"}
                strokeWidth={pass.is_line_breaking ? "1.0" : "0.7"}
                strokeDasharray={pass.success ? "none" : "2,1"}
                className="animate-pulse"
              />
              <circle
                cx={pass.end_location.x}
                cy={pass.end_location.y}
                r="1.2"
                fill={pass.is_line_breaking ? "#00ff85" : "#f59e0b"}
                className="opacity-80"
              />
            </g>
          )}

          {/* SHOT TRAJECTORY LINE */}
          {shot && (
            <g>
              <line
                x1={shot.location.x}
                y1={shot.location.y}
                x2={shot.target_location.x}
                y2={shot.target_location.y}
                stroke={shot.is_goal ? "#00ff85" : "#ef4444"}
                strokeWidth="1.2"
                className="animate-pulse"
              />
              <circle
                cx={shot.target_location.x}
                cy={shot.target_location.y}
                r={shot.is_goal ? "2.5" : "1.5"}
                fill={shot.is_goal ? "#00ff85" : "#ef4444"}
                className="animate-ping"
              />
            </g>
          )}

          {/* BALL POSITION */}
          <g transform={`translate(${loc.x}, ${loc.y})`}>
            {/* Outer Pulse */}
            <circle r={isGoal ? "5.0" : "3.0"} className={`fill-current ${isGoal ? 'text-pl-cyan animate-ping' : 'text-amber-400 opacity-40 animate-pulse'}`} />
            {/* Center Ball */}
            <circle r="1.3" className="fill-white stroke-black" strokeWidth="0.3" />
          </g>
        </svg>

        {/* Dynamic Player Banner on Pitch */}
        {currentEvent && (
          <div
            className="absolute transition-all duration-700 pointer-events-none transform -translate-x-1/2 -translate-y-8"
            style={{
              left: `${(loc.x / 105) * 100}%`,
              top: `${(loc.y / 68) * 100}%`,
            }}
          >
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg flex items-center space-x-1 border whitespace-nowrap ${
              isArsenal
                ? 'bg-red-700/90 text-white border-red-500'
                : 'bg-sky-600/90 text-white border-sky-300'
            }`}>
              <span>{currentEvent.player_name}</span>
              <span className="text-[9px] opacity-75">({currentEvent.event_type})</span>
            </div>
          </div>
        )}

        {/* Goal Banner Alert */}
        {isGoal && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-bounce">
            <div className="bg-gradient-to-r from-pl-pink to-pl-purple border-2 border-pl-cyan px-8 py-3 rounded-2xl text-center shadow-2xl">
              <span className="text-3xl font-extrabold text-white tracking-widest block font-display">GOAL!</span>
              <span className="text-xs font-semibold text-pl-cyan">{currentEvent.player_name} ({currentEvent.team_name})</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Pitch Legend */}
      <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white/20"></span>
            <span>{homeTeam?.name || 'Arsenal FC'} (Left)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-white/20"></span>
            <span>{awayTeam?.name || 'Manchester City'} (Right)</span>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center text-pl-cyan"><Zap className="w-3.5 h-3.5 mr-1" /> Line-Breaking Pass</span>
          <span className="flex items-center text-rose-400"><Target className="w-3.5 h-3.5 mr-1" /> Shot on Target</span>
        </div>
      </div>
    </div>
  );
}
