import React, { useState } from 'react';
import { User, Activity, Zap, Footprints, Target } from 'lucide-react';

export default function PlayerFocusView({ events, homeTeam, awayTeam }) {
  const [selectedPlayer, setSelectedPlayer] = useState('Bukayo Saka');

  const allPlayers = [
    { name: 'Bukayo Saka', number: 7, team: 'Arsenal FC', position: 'RW' },
    { name: 'Erling Haaland', number: 9, team: 'Manchester City', position: 'ST' },
    { name: 'Martin Ødegaard', number: 8, team: 'Arsenal FC', position: 'CAM' },
    { name: 'Kevin De Bruyne', number: 17, team: 'Manchester City', position: 'CAM' },
    { name: 'Declan Rice', number: 41, team: 'Arsenal FC', position: 'CM' },
    { name: 'Phil Foden', number: 47, team: 'Manchester City', position: 'RW' },
  ];

  const playerEvents = events.filter((e) => e.player_name === selectedPlayer);
  const playerPasses = playerEvents.filter((e) => e.event_type === 'pass');
  const successfulPasses = playerPasses.filter((p) => p.pass_detail?.success);
  const passAcc = playerPasses.length ? (successfulPasses.length / playerPasses.length) * 100 : 88.5;
  const playerShots = playerEvents.filter((e) => e.event_type === 'shot' || e.event_type === 'goal');
  const playerGoals = playerEvents.filter((e) => e.event_type === 'goal');

  return (
    <div className="space-y-4">
      {/* Star Player Selector Pills */}
      <div className="bg-pl-card border border-pl-border rounded-xl p-3">
        <span className="text-[11px] text-slate-400 block mb-2 font-semibold">SELECT FAVORITE PLAYER TO TRACK:</span>
        <div className="flex flex-wrap gap-2">
          {allPlayers.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelectedPlayer(p.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${
                selectedPlayer === p.name
                  ? 'bg-pl-cyan text-pl-dark border-pl-cyan shadow-md'
                  : 'bg-pl-dark/80 text-slate-300 border-pl-border hover:border-slate-500'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{p.name}</span>
              <span className="text-[10px] opacity-75">#{p.number}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Player Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-pl-card border border-pl-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400 flex items-center"><Activity className="w-3.5 h-3.5 mr-1 text-pl-cyan" /> Total Touches</span>
          <div className="text-xl font-mono font-bold mt-1 text-pl-cyan">{playerEvents.length}</div>
          <span className="text-[9px] text-slate-400">Match event engagements</span>
        </div>

        <div className="bg-pl-card border border-pl-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400 flex items-center"><Zap className="w-3.5 h-3.5 mr-1 text-amber-400" /> Pass Accuracy</span>
          <div className="text-xl font-mono font-bold mt-1 text-amber-300">{passAcc.toFixed(0)}%</div>
          <span className="text-[9px] text-slate-400">{successfulPasses.length}/{playerPasses.length} passes completed</span>
        </div>

        <div className="bg-pl-card border border-pl-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400 flex items-center"><Footprints className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Est. Distance</span>
          <div className="text-xl font-mono font-bold mt-1 text-emerald-300">
            {(3.2 + playerEvents.length * 0.18).toFixed(1)} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
          <span className="text-[9px] text-slate-400">Peak sprint: 33.8 km/h</span>
        </div>

        <div className="bg-pl-card border border-pl-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400 flex items-center"><Target className="w-3.5 h-3.5 mr-1 text-rose-400" /> Goal Threat</span>
          <div className="text-xl font-mono font-bold mt-1 text-rose-300">
            {playerGoals.length} <span className="text-xs font-normal text-slate-400">goals ({playerShots.length} shots)</span>
          </div>
          <span className="text-[9px] text-slate-400">Clinical finishing threat</span>
        </div>
      </div>

      {/* Player Isolated Event Log */}
      <div className="bg-pl-card border border-pl-border rounded-2xl p-4 shadow-lg">
        <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center">
          <User className="w-3.5 h-3.5 mr-1.5 text-pl-cyan" />
          Real-Time Activity Log for {selectedPlayer}
        </h4>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar text-xs">
          {playerEvents.length === 0 ? (
            <p className="text-slate-400 italic py-4 text-center">No active touches in current passage of play...</p>
          ) : (
            playerEvents.slice().reverse().map((ev, idx) => (
              <div key={idx} className="bg-pl-dark/70 border border-pl-border rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white uppercase text-[10px] mr-2 px-1.5 py-0.5 rounded bg-slate-800">
                    {ev.event_type}
                  </span>
                  <span className="text-slate-300">{ev.explainability.player_impact}</span>
                </div>
                <span className="text-slate-400 font-mono text-[10px]">{ev.minute}'</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
