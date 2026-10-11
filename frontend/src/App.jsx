import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Sparkles,
  User,
  Play,
  RotateCcw,
  FileText,
  Volume2,
  Tv,
} from 'lucide-react';
import PitchVisualizer from './components/PitchVisualizer';
import BroadcastHUD from './components/BroadcastHUD';
import AnalystModeView from './components/AnalystModeView';
import CasualModeView from './components/CasualModeView';
import PlayerFocusView from './components/PlayerFocusView';
import MultiLanguageTicker from './components/MultiLanguageTicker';
import MatchRecapModal from './components/MatchRecapModal';

export default function App() {
  const [activePersona, setActivePersona] = useState('analyst'); // 'analyst', 'casual', 'player'
  const [currentLang, setCurrentLang] = useState('en');
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [insights, setInsights] = useState([]);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [clock, setClock] = useState({ minute: 0, second: 0, phase: '1H' });
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const [recapData, setRecapData] = useState(null);
  const wsRef = useRef(null);

  // Fetch initial teams
  useEffect(() => {
    fetch('http://localhost:8000/api/match/teams')
      .then((res) => res.json())
      .then((data) => {
        setHomeTeam(data.home_team);
        setAwayTeam(data.away_team);
      })
      .catch((err) => {
        console.warn('Backend server not connected yet, using fallback roster:', err);
        setHomeTeam({ name: 'Arsenal FC', short_name: 'ARS' });
        setAwayTeam({ name: 'Manchester City', short_name: 'MCI' });
      });
  }, []);

  // Connect WebSocket stream
  useEffect(() => {
    let ws;
    let timer;

    function connect() {
      ws = new WebSocket('ws://localhost:8000/ws/match-stream');
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'match_update') {
            setCurrentEvent(data.event);
            setEvents((prev) => [...prev, data.event]);
            if (data.insights && data.insights.length > 0) {
              setInsights((prev) => [...prev, ...data.insights]);
            }
            if (data.score) setScore(data.score);
            if (data.clock) setClock(data.clock);
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Retry connection after 3s
        timer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    }

    connect();

    return () => {
      if (ws) ws.close();
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleResetMatch = async () => {
    try {
      await fetch('http://localhost:8000/api/match/reset', { method: 'POST' });
      setEvents([]);
      setInsights([]);
      setScore({ home: 0, away: 0 });
      setClock({ minute: 0, second: 0, phase: '1H' });
      setCurrentEvent(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenRecap = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/match/recap');
      const data = await res.json();
      setRecapData(data);
      setIsRecapOpen(true);
    } catch (err) {
      console.error('Recap fetch error:', err);
      // Fallback recap
      setRecapData({
        title: 'Full Match Intelligence Recap: Arsenal FC - Manchester City',
        summary: 'Intense Premier League encounter characterized by high-tempo pressing and rapid tactical transitions.',
        key_milestones: ['First Half Tactical Block established', 'Contested midfield half-space battle'],
        tactical_verdict: 'Both managers implemented disciplined positional frameworks with quick vertical breakouts.',
      });
      setIsRecapOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#120015] text-slate-100 flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Header Navigation */}
      <header className="flex flex-col md:flex-row items-center justify-between pb-6 border-b border-pl-border/60 gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pl-pink to-pl-purple border border-pl-cyan/40 flex items-center justify-center shadow-lg">
            <Tv className="w-5 h-5 text-pl-cyan" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                INSIDE THE GAME
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-pl-cyan/20 text-pl-cyan border border-pl-cyan/40">
                AI Match Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Microsoft Premier League Hackathon • 5-Stage Agentic Intelligence Pipeline
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleResetMatch}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Match</span>
          </button>

          <button
            onClick={handleOpenRecap}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pl-pink to-pl-purple hover:brightness-110 text-white text-xs font-bold flex items-center space-x-1.5 border border-pl-cyan/30 shadow-lg transition"
          >
            <FileText className="w-3.5 h-3.5 text-pl-cyan" />
            <span>Studio Match Recap</span>
          </button>
        </div>
      </header>

      {/* Main Broadcast TV Scorebug & Tactical Telemetry */}
      <BroadcastHUD
        score={score}
        clock={clock}
        metrics={currentEvent?.tactical_metrics}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        isConnected={isConnected}
      />

      {/* Main Grid: Pitch Visualizer + Persona Intelligence Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Pitch Telemetry */}
        <div className="lg:col-span-7 space-y-4">
          <PitchVisualizer
            currentEvent={currentEvent}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <MultiLanguageTicker
            insights={insights}
            currentLang={currentLang}
            onSelectLang={setCurrentLang}
          />
        </div>

        {/* Right Column (5 cols): Fan Personalization Hub */}
        <div className="lg:col-span-5 space-y-4">
          {/* Persona Switcher Tabs */}
          <div className="bg-pl-card border border-pl-border rounded-2xl p-1.5 shadow-lg flex items-center">
            <button
              onClick={() => setActivePersona('analyst')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                activePersona === 'analyst'
                  ? 'bg-pl-cyan text-pl-dark shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Analyst Mode</span>
            </button>

            <button
              onClick={() => setActivePersona('casual')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                activePersona === 'casual'
                  ? 'bg-pl-cyan text-pl-dark shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Casual Fan</span>
            </button>

            <button
              onClick={() => setActivePersona('player')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                activePersona === 'player'
                  ? 'bg-pl-cyan text-pl-dark shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Player Focus</span>
            </button>
          </div>

          {/* Active Persona Content Panel */}
          {activePersona === 'analyst' && (
            <AnalystModeView events={events} insights={insights} />
          )}

          {activePersona === 'casual' && (
            <CasualModeView currentEvent={currentEvent} insights={insights} />
          )}

          {activePersona === 'player' && (
            <PlayerFocusView
              events={events}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
            />
          )}
        </div>
      </div>

      {/* Match Recap Modal */}
      <MatchRecapModal
        isOpen={isRecapOpen}
        onClose={() => setIsRecapOpen(false)}
        recapData={recapData}
      />
    </div>
  );
}
