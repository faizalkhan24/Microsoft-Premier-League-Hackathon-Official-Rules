# ⚽ Inside the Game: AI Match Intelligence Platform
> **Official Submission for the Microsoft Premier League Hackathon: Inside the Game**  
> *Transforming synthetic football events into explainable match intelligence, real-time broadcast narratives, and personalized fan experiences.*

---

## 🏆 Project Executive Summary

Football stories do not start and end with the scoreline. **Inside the Game** is a next-generation AI match intelligence and broadcast platform built for studio, streaming, and fan personalization scenarios.

By combining physics-calibrated synthetic match event streams, tactical explainability models, and a coordinated **Multi-Agent Intelligence System**, the platform transforms raw event streams (passes, shots, pressures, velocities) into rich tactical narratives, synchronized TV broadcast graphics, and tailored viewing modes for every type of supporter.

---

## 🌟 The 5-Stage Agentic Pipeline

Strictly fulfilling Section 4.1 of the Hackathon Official Rules:

```
[ Realistic Synthetic Event Simulator (StatsBomb/Opta Standard) ]
                             │
                             ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 1: INGEST (Event Streaming & Buffer)             │
│ • Positional pitch coordinates (105m × 68m FIFA pitch) │
│ • Passes, shots, tackles, interceptions, ball velocity │
│ • Premier League rosters (Arsenal FC vs Man City)       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 2: INTERPRET (Derived Metrics & Physics)         │
│ • Pass Difficulty Rating (geometry, angle, pressure)   │
│ • Expected Goals (xG) Shot Quality Model               │
│ • Ball & shot exit velocities (km/h)                   │
│ • Physical metrics: distance covered & sprint speed    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 3: EXPLAIN (Tactical Intelligence Engine)        │
│ • Control vs. Chaos Index (0-100 stability score)      │
│ • Defensive Line Breaches & PPDA Pressing Intensity    │
│ • Territorial Field Tilt & Dynamic Momentum Swings     │
│ • "Why Moments Matter" contextual reasoning generator  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 4: MULTI-AGENT ORCHESTRATION                     │
│ • Tactical Analyst Agent: In-depth spatial breakdowns  │
│ • Live Commentator Agent: Broadcast play-by-play       │
│ • Narrative Recap Agent: Dynamic match storylines      │
│ • Multilingual Agent: Localization (EN, ES, FR, DE,    │
│   AR, HI) with culturally authentic football terms     │
│ • Agent Orchestrator: Shared match state blackboard    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 5: RENDER & PERSONALIZE (Broadcast Studio)       │
│ • 2D Interactive Pitch Visualizer with vector trails   │
│ • Synchronized Broadcast HUD Scorebug & telemetry bar  │
│ • 3-Way Fan Persona Switcher:                          │
│   * Analyst Mode: Deep telemetry, line breaks, xG      │
│   * Casual Fan Mode: Simplified "Why It Matters" cards │
│   * Player-Focus Mode: Star player tracking & stats    │
│ • Automated 90-Minute Studio Post-Match Recap Report   │
└────────────────────────────────────────────────────────┘
```

---

## 🎯 Target Hackathon Categories

1. **Grand Prize (First / Second Place)**: Comprehensive end-to-end transformation of synthetic data into explainable broadcast intelligence.
2. **Best Multi-Agent System Prize**: Purposeful agent specialization (Tactical Analyst, Commentator, Recap Chronicler, Translator) collaborating over shared state.
3. **Best Use of Microsoft Foundry Project**: Agent design patterns, prompt structuring, and evaluation metrics.
4. **Best Azure Cloud Native Integration**: Containerized microservices, FastAPI async streaming, and Azure Container Apps deployment manifests (`azure-container-app.yaml`).
5. **Best Enterprise Solution**: Resilient WebSocket streaming, CORS governance, health checks, and production Docker containerization.

---

## 🏗️ Repository Architecture

```
├── backend/
│   ├── models/             # Pydantic data schemas (MatchEvent, Teams, Metrics)
│   ├── simulator/          # Realistic Premier League match event generator
│   │   ├── rosters.py      # Arsenal FC & Manchester City player rosters
│   │   └── match_generator.py # Pitch physics, pass chains & xG model
│   ├── analytics/          # Tactical explainability engine
│   │   └── metrics_engine.py  # Control vs Chaos, Pass Difficulty, PPDA
│   ├── agents/             # Multi-Agent intelligence system
│   │   └── multi_agent_system.py # Analyst, Commentator, Recap & Translator
│   └── api/                # FastAPI & WebSocket streaming server
│       └── server.py       # REST endpoints + /ws/match-stream
├── frontend/               # Interactive Broadcast Studio & Personalization UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── PitchVisualizer.jsx     # 2D pitch telemetry & animations
│   │   │   ├── BroadcastHUD.jsx        # TV Scorebug & telemetry indicators
│   │   │   ├── AnalystModeView.jsx     # Analyst telemetry & reasoning
│   │   │   ├── CasualModeView.jsx      # Simplified "Why It Matters"
│   │   │   ├── PlayerFocusView.jsx     # Star player spotlight tracking
│   │   │   ├── MultiLanguageTicker.jsx # Multilingual commentary ticker
│   │   │   └── MatchRecapModal.jsx     # Automated studio match recap report
│   │   ├── App.jsx         # Master studio container
│   │   └── index.css       # Tailwind CSS & Premier League styling
│   └── package.json
├── tests/
│   └── test_pipeline.py    # Automated test suite (Pytest & TestClient)
├── Dockerfile              # Multi-stage production container build
├── docker-compose.yml      # One-click local orchestration
├── azure-container-app.yaml # Azure Container App deployment spec
└── requirements.txt        # Python backend dependencies
```

---

## 🚀 Quickstart Guide

### 1. Run with Docker (Recommended)
Launch the entire platform (backend API, WebSocket engine, and frontend broadcast studio) with a single command:
```bash
docker compose up --build
```
Open **`http://localhost:8000`** in your browser.

---

### 2. Run Locally (Development Mode)

#### Backend:
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI and WebSocket streaming server
python -m uvicorn backend.api.server:app --reload --port 8000
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** to view the live Broadcast Studio.

---

### 3. Run Automated Tests
```bash
python -m pytest tests/test_pipeline.py -v
```

---

## 📺 Hackathon Submission Checklist

- [x] **5-Stage Pipeline Delivered**: Ingest -> Interpret -> Explain -> Multi-Agent -> Render & Personalize.
- [x] **Synthetic Football Data Compliant**: Synthetic pitch coordinate vectors ($105m \times 68m$) without copyrighted broadcast footage redistribution.
- [x] **Interactive Functioning Demo**: Real-time 2D pitch visualizer with synchronized broadcast HUD.
- [x] **Multi-Agent Collaboration**: Specialized roles (Tactical Analyst, Play-by-Play Commentator, Recap Chronicler, Multilingual Translator).
- [x] **Fan Personalization**: 3 distinct viewing personas (Analyst Mode, Casual Fan Mode, Player-Focus Mode).
- [x] **Enterprise Ready**: Full Dockerfile, health checks, and Azure Container App manifest.
- [x] **Public GitHub Repository**: Complete documentation and automated test coverage.
