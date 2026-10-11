import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Sparkles,
  User,
  RotateCcw,
  FileText,
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

  // Playback & Audio Controls State
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const wsRef = useRef(null);
  const lastSpokenIdRef = useRef(null);

  // Text-to-Speech (TTS) synthesizer helper
  const speakText = (text, lang = 'en') => {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const langCodes = {
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        ar: 'ar-SA',
        hi: 'hi-IN',
      };
      utterance.lang = langCodes[lang] || 'en-US';

      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find((v) => v.lang.startsWith(lang));
      if (matched) utterance.voice = matched;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  const handleToggleAudio = () => {
    const next = !isAudioEnabled;
    setIsAudioEnabled(next);
    if (next) {
      speakText('Premier League live audio commentary active', currentLang);
    } else {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleTogglePause = async () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: nextPaused ? 'pause' : 'resume' }));
      }
      await fetch(nextPaused ? '/api/match/pause' : '/api/match/resume', { method: 'POST' });
    } catch (e) {
      console.warn('Pause toggle error:', e);
    }
  };

  const handleChangeSpeed = async (speed) => {
    setPlaybackSpeed(speed);
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'speed', value: speed }));
      }
      await fetch(`/api/match/speed?speed=${speed}`, { method: 'POST' });
    } catch (e) {
      console.warn('Speed change error:', e);
    }
  };

  // Fetch initial teams
  useEffect(() => {
    fetch('/api/match/teams')
      .then((res) => {
        if (!res.ok) throw new Error('Teams endpoint error');
        return res.json();
      })
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
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host || 'localhost:8000';
      // In local vite dev (port 3000), point to 8000
      const wsUrl = host.includes(':3000')
        ? 'ws://localhost:8000/ws/match-stream'
        : `${protocol}//${host}/ws/match-stream`;

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'initial_sync') {
            if (data.score) setScore(data.score);
            if (data.clock) setClock(data.clock);
            if (data.is_paused !== undefined) setIsPaused(data.is_paused);
            if (data.speed_multiplier !== undefined) setPlaybackSpeed(data.speed_multiplier);
            if (data.recent_events && data.recent_events.length > 0) {
              setEvents(data.recent_events);
              setCurrentEvent(data.recent_events[data.recent_events.length - 1]);
            }
            if (data.recent_insights && data.recent_insights.length > 0) {
              setInsights(data.recent_insights);
            }
          } else if (data.type === 'match_update') {
            setCurrentEvent(data.event);
            setEvents((prev) => {
              const updated = [...prev, data.event];
              return updated.length > 200 ? updated.slice(-150) : updated;
            });
            if (data.insights && data.insights.length > 0) {
              setInsights((prev) => {
                const updated = [...prev, ...data.insights];
                return updated.length > 100 ? updated.slice(-80) : updated;
              });

              // Voice Commentary Trigger (if enabled)
              if (isAudioEnabled) {
                const spokenInsight = data.insights.find(
                  (i) =>
                    (i.language === currentLang || (!i.language && currentLang === 'en')) &&
                    (i.persona_target === 'casual' ||
                      i.persona_target === 'all' ||
                      i.importance === 'critical' ||
                      i.importance === 'high')
                );
                if (spokenInsight && spokenInsight.insight_id !== lastSpokenIdRef.current) {
                  lastSpokenIdRef.current = spokenInsight.insight_id;
                  speakText(spokenInsight.content, currentLang);
                }
              }
            }
            if (data.score) setScore(data.score);
            if (data.clock) setClock(data.clock);
            if (data.is_paused !== undefined) setIsPaused(data.is_paused);
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        timer = setTimeout(connect, 2500);
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
  }, [isAudioEnabled, currentLang]);

  const handleResetMatch = async () => {
    try {
      await fetch('/api/match/reset', { method: 'POST' });
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
      const res = await fetch('/api/match/recap');
      const data = await res.json();
      setRecapData(data);
      setIsRecapOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-pl-dark text-slate-100 p-3 sm:p-6 font-sans">
      {/* Top Navigation & Brand Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5 border-b border-pl-border/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pl-pink via-pl-purple to-pl-cyan p-0.5 shadow-lg shadow-pink-500/20">
            <div className="w-full h-full bg-pl-dark rounded-[14px] flex items-center justify-center">
              <Tv className="w-5 h-5 text-pl-cyan" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white font-display">
                INSIDE THE GAME
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-pl-purple text-pl-cyan border border-pl-cyan/30">
                AI Studio
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Microsoft AI Foundry • Match Intelligence & Multimodal Overlays
            </p>
          </div>
        </div>

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

      {/* Main Broadcast TV Scorebug & Tactical Telemetry with Play/Pause/Audio */}
      <BroadcastHUD
        score={score}
        clock={clock}
        metrics={currentEvent?.tactical_metrics}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        isConnected={isConnected}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={handleChangeSpeed}
        isAudioEnabled={isAudioEnabled}
        onToggleAudio={handleToggleAudio}
        isSpeaking={isSpeaking}
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
            <AnalystModeView events={events} insights={insights} currentLang={currentLang} />
          )}

          {activePersona === 'casual' && (
            <CasualModeView currentEvent={currentEvent} insights={insights} currentLang={currentLang} />
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
