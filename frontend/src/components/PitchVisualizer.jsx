import React, { useState, useMemo } from 'react';
import { Target, Zap, Grid, Users, Radio, Compass, Sparkles, Activity, Layers } from 'lucide-react';

export default function PitchVisualizer({ currentEvent, homeTeam, awayTeam }) {
  const [showVectors, setShowVectors] = useState(true);
  const [showZones, setShowZones] = useState(false);
  const [showFormations, setShowFormations] = useState(false);

  const loc = currentEvent?.location || { x: 52.5, y: 34.0 };
  const pass = currentEvent?.pass_detail;
  const shot = currentEvent?.shot_detail;
  const isGoal = currentEvent?.event_type === 'goal';
  const isArsenal = currentEvent?.team_id === 'arsenal';

  // Distance to target goal
  const targetGoalX = isArsenal ? 105.0 : 0.0;
  const distToGoal = Math.sqrt(Math.pow(targetGoalX - loc.x, 2) + Math.pow(34.0 - loc.y, 2)).toFixed(1);

  // Formation tactical coordinates (Arsenal 4-3-3 attacking left-to-right, Man City 4-3-3 right-to-left)
  const formations = useMemo(() => {
    return {
      arsenal: [
        { name: 'Raya', number: 22, pos: 'GK', x: 5.5, y: 34.0 },
        { name: 'White', number: 4, pos: 'RB', x: 22.0, y: 11.0 },
        { name: 'Saliba', number: 2, pos: 'CB', x: 18.0, y: 25.0 },
        { name: 'Gabriel', number: 6, pos: 'CB', x: 18.0, y: 43.0 },
        { name: 'Timber', number: 12, pos: 'LB', x: 22.0, y: 57.0 },
        { name: 'Partey', number: 5, pos: 'CDM', x: 34.0, y: 34.0 },
        { name: 'Rice', number: 41, pos: 'CM', x: 44.0, y: 21.0 },
        { name: 'Ødegaard', number: 8, pos: 'CAM', x: 48.0, y: 47.0 },
        { name: 'Martinelli', number: 11, pos: 'LW', x: 68.0, y: 13.0 },
        { name: 'Saka', number: 7, pos: 'RW', x: 68.0, y: 55.0 },
        { name: 'Havertz', number: 29, pos: 'ST', x: 74.0, y: 34.0 },
      ],
      mancity: [
        { name: 'Ederson', number: 31, pos: 'GK', x: 99.5, y: 34.0 },
        { name: 'Gvardiol', number: 24, pos: 'LB', x: 83.0, y: 11.0 },
        { name: 'Akanji', number: 25, pos: 'CB', x: 87.0, y: 25.0 },
        { name: 'Dias', number: 3, pos: 'CB', x: 87.0, y: 43.0 },
        { name: 'Walker', number: 2, pos: 'RB', x: 83.0, y: 57.0 },
        { name: 'Rodri', number: 16, pos: 'CDM', x: 71.0, y: 34.0 },
        { name: 'Kovacic', number: 8, pos: 'CM', x: 61.0, y: 21.0 },
        { name: 'De Bruyne', number: 17, pos: 'CAM', x: 57.0, y: 47.0 },
        { name: 'Foden', number: 47, pos: 'LW', x: 37.0, y: 13.0 },
        { name: 'Grealish', number: 10, pos: 'RW', x: 37.0, y: 55.0 },
        { name: 'Haaland', number: 9, pos: 'ST', x: 31.0, y: 34.0 },
      ],
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-pl-border bg-gradient-to-b from-[#091f12] via-[#07190e] to-[#040e08] shadow-2xl p-4">
      {/* Top Telemetry Header & Interactive View Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 text-xs">
        {/* Telemetry Chips */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <div className="flex items-center space-x-1.5 bg-pl-dark/90 px-2.5 py-1 rounded-lg border border-pl-border/80">
            <span className="w-2 h-2 rounded-full bg-pl-cyan animate-ping"></span>
            <span className="font-mono font-bold text-slate-200">
              LOC: <span className="text-pl-cyan">{loc.x.toFixed(1)}m</span>, <span className="text-pl-cyan">{loc.y.toFixed(1)}m</span>
            </span>
          </div>

          <div className="bg-pl-dark/80 px-2.5 py-1 rounded-lg border border-pl-border/60 text-slate-300 font-mono text-[11px]">
            Goal Dist: <strong className="text-amber-400">{distToGoal}m</strong>
          </div>

          {pass && (
            <div className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center space-x-1 border ${
              pass.is_line_breaking ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              <Zap className="w-3 h-3" />
              <span>Pass Diff: {(pass.difficulty_rating * 100).toFixed(0)}%</span>
            </div>
          )}

          {shot && (
            <div className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
              <Target className="w-3 h-3" />
              <span>xG: {shot.xg.toFixed(2)} | {shot.shot_speed_kmh} km/h</span>
            </div>
          )}
        </div>

        {/* View Controls Toggle Pills */}
        <div className="flex items-center space-x-1.5 bg-pl-dark/90 p-1 rounded-xl border border-pl-border self-end sm:self-auto">
          <button
            onClick={() => setShowVectors(!showVectors)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 ${
              showVectors ? 'bg-pl-cyan text-pl-dark shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Passing & Shot Vectors"
          >
            <Compass className="w-3 h-3" />
            <span>Vectors</span>
          </button>

          <button
            onClick={() => setShowZones(!showZones)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 ${
              showZones ? 'bg-pl-cyan text-pl-dark shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle 18 Tactical FIFA Pitch Zones"
          >
            <Grid className="w-3 h-3" />
            <span>Zones</span>
          </button>

          <button
            onClick={() => setShowFormations(!showFormations)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 ${
              showFormations ? 'bg-pl-cyan text-pl-dark shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Team 4-3-3 Formations"
          >
            <Users className="w-3 h-3" />
            <span>Formations</span>
          </button>
        </div>
      </div>

      {/* Main Pitch Canvas (FIFA 105m × 68m Aspect Ratio) */}
      <div className="relative aspect-[105/68] w-full rounded-xl overflow-hidden border-2 border-emerald-900/60 shadow-2xl bg-[#0f381c]">
        {/* Lawn Mower Grass Cut Stripes (14 alternating Premier League turf bands) */}
        <div className="absolute inset-0 flex pointer-events-none opacity-40">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 ${i % 2 === 0 ? 'bg-[#154624]' : 'bg-[#0b2f17]'}`}
            />
          ))}
        </div>

        {/* Stadium Floodlight Vignette Effect */}
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-30"></div>

        {/* SVG Tactical Pitch Elements */}
        <svg
          viewBox="0 0 105 68"
          className="absolute inset-0 w-full h-full stroke-emerald-100/60 fill-none"
          strokeWidth="0.45"
        >
          {/* Tactical 18-Zone FIFA Grid (When Toggled) */}
          {showZones && (
            <g className="stroke-emerald-400/25" strokeWidth="0.25" strokeDasharray="1.5,1.5">
              {/* Pitch Thirds: 35m and 70m */}
              <line x1="35.0" y1="0.5" x2="35.0" y2="67.5" />
              <line x1="70.0" y1="0.5" x2="70.0" y2="67.5" />
              {/* Width Channels: 14m, 27m, 41m, 54m */}
              <line x1="0.5" y1="14.0" x2="104.5" y2="14.0" />
              <line x1="0.5" y1="27.0" x2="104.5" y2="27.0" />
              <line x1="0.5" y1="41.0" x2="104.5" y2="41.0" />
              <line x1="0.5" y1="54.0" x2="104.5" y2="54.0" />
            </g>
          )}

          {/* Outer Touchline & Bylines */}
          <rect x="0.5" y="0.5" width="104" height="67" className="stroke-white/80" strokeWidth="0.5" />

          {/* Halfway Line & Center Circle */}
          <line x1="52.5" y1="0.5" x2="52.5" y2="67.5" className="stroke-white/70" strokeWidth="0.5" />
          <circle cx="52.5" cy="34" r="9.15" className="stroke-white/70" strokeWidth="0.5" />
          <circle cx="52.5" cy="34" r="0.5" className="fill-white stroke-none" />

          {/* Corner Arcs (1m radius at all 4 corners) */}
          <path d="M 0.5 1.5 A 1 1 0 0 0 1.5 0.5" className="stroke-white/70" />
          <path d="M 103.5 0.5 A 1 1 0 0 0 104.5 1.5" className="stroke-white/70" />
          <path d="M 0.5 66.5 A 1 1 0 0 1 1.5 67.5" className="stroke-white/70" />
          <path d="M 104.5 66.5 A 1 1 0 0 0 103.5 67.5" className="stroke-white/70" />

          {/* Left Penalty Area (Arsenal Goal End) */}
          <rect x="0.5" y="13.84" width="16.5" height="40.32" className="stroke-white/80" strokeWidth="0.5" />
          <rect x="0.5" y="24.84" width="5.5" height="18.32" className="stroke-white/70" strokeWidth="0.45" />
          <circle cx="11.0" cy="34.0" r="0.5" className="fill-white stroke-none" />
          <path d="M 17.0 27.5 A 9.15 9.15 0 0 1 17.0 40.5" className="stroke-white/70" strokeWidth="0.45" />

          {/* Right Penalty Area (Man City Goal End) */}
          <rect x="88.0" y="13.84" width="16.5" height="40.32" className="stroke-white/80" strokeWidth="0.5" />
          <rect x="99.0" y="24.84" width="5.5" height="18.32" className="stroke-white/70" strokeWidth="0.45" />
          <circle cx="94.0" cy="34.0" r="0.5" className="fill-white stroke-none" />
          <path d="M 88.0 27.5 A 9.15 9.15 0 0 0 88.0 40.5" className="stroke-white/70" strokeWidth="0.45" />

          {/* 3D Goal Nets (Depth extending outside the field) */}
          <rect x="-2.0" y="30.34" width="2.5" height="7.32" className="stroke-pl-cyan/80 fill-pl-cyan/10" strokeWidth="0.4" />
          <rect x="104.5" y="30.34" width="2.5" height="7.32" className="stroke-pl-cyan/80 fill-pl-cyan/10" strokeWidth="0.4" />

          {/* FORMATION PLAYERS (When Toggled) */}
          {showFormations && (
            <g>
              {/* Arsenal Roster (Red Nodes) */}
              {formations.arsenal.map((p) => {
                const isActive = currentEvent?.player_name === p.name;
                return (
                  <g key={`ars_${p.number}`} transform={`translate(${p.x}, ${p.y})`}>
                    <circle r={isActive ? "2.6" : "1.8"} className="fill-red-600 stroke-white/90" strokeWidth="0.3" />
                    {isActive && (
                      <circle r="3.8" className="stroke-amber-400 fill-none animate-ping" strokeWidth="0.4" />
                    )}
                    <text y="0.6" textAnchor="middle" className="fill-white font-mono text-[1.4px] font-bold stroke-none pointer-events-none">
                      {p.number}
                    </text>
                  </g>
                );
              })}

              {/* Man City Roster (Sky Blue Nodes) */}
              {formations.mancity.map((p) => {
                const isActive = currentEvent?.player_name === p.name;
                return (
                  <g key={`mci_${p.number}`} transform={`translate(${p.x}, ${p.y})`}>
                    <circle r={isActive ? "2.6" : "1.8"} className="fill-sky-500 stroke-white/90" strokeWidth="0.3" />
                    {isActive && (
                      <circle r="3.8" className="stroke-amber-400 fill-none animate-ping" strokeWidth="0.4" />
                    )}
                    <text y="0.6" textAnchor="middle" className="fill-white font-mono text-[1.4px] font-bold stroke-none pointer-events-none">
                      {p.number}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* PASS TRAJECTORY VECTOR */}
          {showVectors && pass && (
            <g>
              {/* Trajectory Laser Line */}
              <line
                x1={pass.start_location.x}
                y1={pass.start_location.y}
                x2={pass.end_location.x}
                y2={pass.end_location.y}
                stroke={pass.is_line_breaking ? "#00ff85" : "#f59e0b"}
                strokeWidth={pass.is_line_breaking ? "1.2" : "0.8"}
                strokeDasharray={pass.success ? "none" : "2,1"}
                className="animate-pulse"
              />

              {/* Origin Marker */}
              <circle
                cx={pass.start_location.x}
                cy={pass.start_location.y}
                r="1.2"
                fill={pass.is_line_breaking ? "#00ff85" : "#f59e0b"}
                className="opacity-90"
              />

              {/* Recipient Target Pulse */}
              <circle
                cx={pass.end_location.x}
                cy={pass.end_location.y}
                r="2.2"
                fill="none"
                stroke={pass.is_line_breaking ? "#00ff85" : "#f59e0b"}
                strokeWidth="0.5"
                className="animate-ping opacity-75"
              />
            </g>
          )}

          {/* SHOT TRAJECTORY VECTOR */}
          {showVectors && shot && (
            <g>
              <line
                x1={shot.location.x}
                y1={shot.location.y}
                x2={shot.target_location.x}
                y2={shot.target_location.y}
                stroke={shot.is_goal ? "#00ff85" : "#ef4444"}
                strokeWidth="1.4"
                className="animate-pulse"
              />
              <circle
                cx={shot.target_location.x}
                cy={shot.target_location.y}
                r={shot.is_goal ? "3.2" : "1.8"}
                fill={shot.is_goal ? "#00ff85" : "#ef4444"}
                className="animate-ping"
              />
            </g>
          )}

          {/* DYNAMIC BALL & ACTION POSITION */}
          <g transform={`translate(${loc.x}, ${loc.y})`}>
            {/* Outer Action Halo */}
            <circle
              r={isGoal ? "6.0" : "3.6"}
              className={`${isGoal ? 'fill-pl-cyan/40 animate-ping' : 'fill-amber-400/30 animate-pulse'}`}
            />
            {/* 3D Soccer Ball Core */}
            <circle r="1.4" className="fill-white stroke-slate-900" strokeWidth="0.35" />
            <circle r="0.6" className="fill-slate-900 stroke-none" />
          </g>
        </svg>

        {/* Dynamic Player Badge Floating Over Ball */}
        {currentEvent && (
          <div
            className="absolute transition-all duration-500 pointer-events-none transform -translate-x-1/2 -translate-y-9"
            style={{
              left: `${(loc.x / 105) * 100}%`,
              top: `${(loc.y / 68) * 100}%`,
            }}
          >
            <div
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-2xl flex items-center space-x-1.5 border whitespace-nowrap backdrop-blur-md ${
                isArsenal
                  ? 'bg-red-700/90 text-white border-red-400'
                  : 'bg-sky-600/90 text-white border-sky-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              <span>{currentEvent.player_name}</span>
              <span className="text-[9px] font-mono opacity-80 uppercase">
                [{currentEvent.event_type}]
              </span>
            </div>
          </div>
        )}

        {/* Goal Explosive Banner Overlay */}
        {isGoal && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md animate-bounce">
            <div className="bg-gradient-to-r from-pl-pink via-purple-700 to-pl-cyan border-2 border-white px-8 py-4 rounded-3xl text-center shadow-2xl">
              <span className="text-4xl font-extrabold text-white tracking-widest block font-display drop-shadow-lg">
                GOAL!
              </span>
              <span className="text-sm font-bold text-pl-cyan block mt-1">
                {currentEvent.player_name} ({currentEvent.team_name})
              </span>
              <span className="text-[11px] text-slate-200 font-mono mt-0.5 block">
                Shot Exit Velocity: {shot?.shot_speed_kmh} km/h • xG: {shot?.xg.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Pitch Legend & Tactical Compass */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-3 text-[11px] text-slate-400 gap-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white/20"></span>
            <span className="font-bold text-slate-200">{homeTeam?.name || 'Arsenal FC'}</span>
            <span className="text-slate-400 text-[10px]">&rarr; Attacking Right</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-white/20"></span>
            <span className="font-bold text-slate-200">{awayTeam?.name || 'Manchester City'}</span>
            <span className="text-slate-400 text-[10px]">&larr; Attacking Left</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center text-emerald-400 font-semibold">
            <Zap className="w-3.5 h-3.5 mr-1" /> Line-Break Laser
          </span>
          <span className="flex items-center text-amber-400 font-semibold">
            <Compass className="w-3.5 h-3.5 mr-1" /> Circulation Pass
          </span>
          <span className="flex items-center text-rose-400 font-semibold">
            <Target className="w-3.5 h-3.5 mr-1" /> Shot on Target
          </span>
        </div>
      </div>
    </div>
  );
}
