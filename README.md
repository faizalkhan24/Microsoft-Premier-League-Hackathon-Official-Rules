# ⚽ Inside the Game: AI Match Intelligence Platform
> **Official Submission for the Microsoft Premier League Hackathon: Inside the Game**  
> *Transforming synthetic football events into explainable match intelligence, real-time broadcast narratives, and personalized fan experiences.*

---

## 🏆 Project Executive Summary

Football stories do not start and end with the scoreline. **Inside the Game** is a next-generation AI match intelligence and broadcast platform built for studio, streaming, and fan personalization scenarios.

By combining physics-calibrated synthetic match event streams, tactical explainability models, and a coordinated **Multi-Agent Intelligence System**, the platform transforms raw event streams (passes, shots, pressures, velocities) into rich tactical narratives, synchronized TV broadcast graphics, and tailored viewing modes for every type of supporter.

---

## 🌟 The 5-Stage Agentic Pipeline

Strictly fulfilling **Section 4.1** of the Hackathon Official Rules:

```
[ Realistic Synthetic Event Simulator (StatsBomb/Opta Standard) ]
                             │
                             ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 1: INGEST (Event Streaming & Buffer)             │
│ • Positional pitch coordinates (105m × 68m FIFA pitch) │
│ • Direction-aware physics: Home (x→105) & Away (x→0)   │
│ • Passes, shots, tackles, interceptions, ball velocity │
│ • Premier League rosters (Arsenal FC vs Man City)       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 2: INTERPRET (Derived Metrics & Physics)         │
│ • Direction-Aware Pass Difficulty Rating (0.05 - 0.98) │
│ • Direction-Aware Expected Goals (xG) Geometric Model  │
│ • Ball & shot exit velocities (km/h)                   │
│ • Physical metrics: distance covered & sprint speed    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 3: EXPLAIN (Tactical Intelligence Engine)        │
│ • Control vs. Chaos Index (0-100 stability score)      │
│ • Defensive Line Breaches & Real PPDA Pressing Meter   │
│ • Cumulative Possession (%) & Final Third Field Tilt   │
│ • Real-time "Why Moments Matter" evidence reasoning    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 4: MULTI-AGENT ORCHESTRATION                     │
│ • Tactical Analyst Agent: Spatial breakdowns & xG      │
│ • Live Commentator Agent: Broadcast play-by-play       │
│ • Narrative Recap Agent: Storylines & full match recap │
│ • Multilingual Agent: Localization (EN, ES, FR, DE,    │
│   AR with RTL, HI) with native football idioms         │
│ • Agent Orchestrator: Shared blackboard & cooldowns    │
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
│   * Player-Focus Mode: Dynamic roster player tracking  │
│ • Automated 90-Minute Studio Post-Match Recap Report   │
└────────────────────────────────────────────────────────┘
```

---

## 🎯 Target Hackathon Categories

1. **Grand Prize (First / Second Place)**: Comprehensive end-to-end transformation of synthetic data into explainable broadcast intelligence.
2. **Best Multi-Agent System Prize**: Purposeful agent specialization (Tactical Analyst, Commentator, Recap Chronicler, Translator) collaborating over shared state with evidence tracking and cooldown controls.
3. **Best Use of Microsoft Foundry Project**: Agent design patterns, structured prompt schemas, and evaluation metrics.
4. **Best Azure Cloud Native Integration**: Containerized microservices, FastAPI async streaming, and Azure Container Apps deployment manifests (`azure-container-app.yaml`).
5. **Best Enterprise Solution**: Centralized `MatchBroadcastManager`, subscriber pub-sub WebSockets, CORS governance, health checks, and production Docker containerization.

---

## 📐 Mathematical Models & Football Metrics

### A. Direction-Aware Expected Goals ($xG$)
$$xG = \text{clamp}\left(\exp(-0.115 \cdot d_{\text{goal}}) \times \left(\frac{\theta}{\pi} \times 3.4\right) \times M_{\text{type}}, 0.01, 0.96\right)$$
- $d_{\text{goal}}$: Euclidean distance to target goal center ($x=105, y=34$ for Home; $x=0, y=34$ for Away).
- $\theta$: Subtended visual angle between the goal posts ($7.32\text{m}$).
- $M_{\text{type}}$: Shot multiplier (open play: $1.0$, header: $0.55$, volley: $0.70$, free kick: $0.45$, penalty: $0.78$).
- *Note*: Documented as a calibrated geometric heuristic model based on spatial geometry.

### B. Direction-Aware Pass Difficulty Rating
$$\text{Difficulty} = \text{clamp}\left(0.08 + 0.45 \cdot \frac{d}{50} + 0.25 \cdot \frac{\Delta x_{\text{prog}}}{35} + \text{LineBreakBonus} + \text{SpeedBonus}, 0.05, 0.98\right)$$
- $\Delta x_{\text{prog}}$: Positive forward displacement towards target goal ($end.x - start.x$ for Home; $start.x - end.x$ for Away).
- Semantics: $0.05-0.20$ = routine safe pass; $0.76-0.98$ = high-risk vertical line-breaking pass.

### C. Control vs. Chaos Index ($0 - 100$)
- Rolling state metric tracking sequence length and turnover proximity.
- Successful passing sequences accumulate possession stability towards $100$.
- Turnovers, interceptions, and defensive line breaks reduce the index towards Chaos ($<30$).

### D. Passes Allowed Per Defensive Action (PPDA)
$$\text{PPDA} = \frac{\text{Opponent Passes in Middle/Attacking Third}}{\text{Defensive Actions (Tackles + Interceptions)}}$$
- Real-time calculation with safety guard for zero defensive actions.

---

## 🏗️ Repository Architecture

```
├── backend/
│   ├── models/
│   │   ├── __init__.py                # Package exports
│   │   └── schemas.py                 # Pydantic schemas (MatchEvent, Teams, Metrics, AgentInsight)
│   ├── simulator/
│   │   ├── rosters.py                 # Arsenal & Man City squad data + attacking directions
│   │   └── match_generator.py         # Physics, pass vectors, xG, and player tracking
│   ├── analytics/
│   │   └── metrics_engine.py          # Direction-aware xG, Pass Difficulty, PPDA, Control vs Chaos
│   ├── agents/
│   │   └── multi_agent_system.py      # 4 autonomous agents + Cooldown & Evidence Orchestrator
│   └── api/
│       └── server.py                  # Centralized MatchBroadcastManager + Pub-Sub WebSockets
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PitchVisualizer.jsx    # 2D pitch telemetry (105m × 68m SVG)
│   │   │   ├── BroadcastHUD.jsx       # TV Scorebug & telemetry indicators
│   │   │   ├── AnalystModeView.jsx    # Data-hungry analyst view with evidence IDs
│   │   │   ├── CasualModeView.jsx     # Casual fan "Why it matters" view
│   │   │   ├── PlayerFocusView.jsx    # Dynamic roster player tracking HUD
│   │   │   ├── MultiLanguageTicker.jsx # Multilingual commentary ticker (RTL for Arabic)
│   │   │   └── MatchRecapModal.jsx    # Automated studio post-match recap modal
│   │   ├── App.jsx                    # Master application container
│   │   ├── index.css                  # Premier League design system & Tailwind CSS
│   │   └── main.jsx                   # React root entry
│   ├── package.json                   # React, Vite, Lucide, Tailwind dependencies
│   ├── vite.config.js                 # Vite dev proxy & build configuration
│   └── tailwind.config.js             # Custom Premier League color palette
├── tests/
│   └── test_pipeline.py               # Comprehensive pytest suite (17 tests, 92% coverage)
├── Dockerfile                         # Multi-stage production container build
├── docker-compose.yml                 # Local developer orchestration
├── azure-container-app.yaml            # Azure Cloud-Native deployment manifest
├── requirements.txt                   # Backend Python dependencies
├── .gitignore                         # Standard git ignore rules
├── README.md                          # Main repository documentation & guide
└── PROJECT_SUMMARY.md                 # Complete project audit and completion report
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

### 3. Run Automated Tests with Coverage
```bash
python -m pytest --cov=backend --cov-report=term-missing tests/
```
**Results**: `17 passed in 0.72s (92% total test coverage)`.

---

## 📺 Hackathon Submission Checklist

- [x] **5-Stage Pipeline Delivered**: Ingest -> Interpret -> Explain -> Multi-Agent -> Render & Personalize.
- [x] **Synthetic Football Data Compliant**: Synthetic pitch coordinate vectors ($105m \times 68m$) without copyrighted broadcast footage redistribution.
- [x] **Interactive Functioning Demo**: Real-time 2D pitch visualizer with synchronized broadcast HUD.
- [x] **Multi-Agent Collaboration**: Specialized roles (Tactical Analyst, Play-by-Play Commentator, Recap Chronicler, Multilingual Translator).
- [x] **Evidence Traceability**: Every tactical insight links to verified event IDs and supporting statistics.
- [x] **Fan Personalization**: 3 distinct viewing personas (Analyst Mode, Casual Fan Mode, Player-Focus Mode across full squads).
- [x] **Enterprise Ready**: Full Dockerfile, health checks, and Azure Container App manifest.
- [x] **Public GitHub Repository**: Complete documentation and automated test coverage.
