# CLEANSPOT — Smart Civic Waste Reporting & Intelligence Platform

> **“See it. Report it. Clean it.”**
> 
> *Citizen-Driven Waste Management & Smart City Cleanliness Platform*
> 
> Transforming everyday civic waste reporting into verified, geolocated, AI-assisted municipal actions — while leveraging recurrence analytics to identify recurring hotspots and drive preventive urban sanitation planning.

**Primary United Nations SDGs:**
- **SDG 11: Sustainable Cities and Communities (Target 11.6)** — Reduce the adverse per capita environmental impact of cities, including by paying special attention to municipal waste management.
- **SDG 12: Responsible Consumption and Production (Target 12.5)** — Substantially reduce waste generation through prevention, reduction, recycling, and reuse.

---

## 1. The Closed Operational Loop

CleanCity goes far beyond a generic CRUD complaint board. It implements a closed-loop municipal workflow:

```
CITIZEN DISCOVERS WASTE
        ↓
SNAP / UPLOAD PHOTO (30-60 sec)
        ↓
GEMINI MULTIMODAL AI (Hazard Classification, Volume, Severity, Confidence)
        ↓
GEOLOCATION & REVERSE GEOCODING PIN CONFIRMATION
        ↓
MUNICIPAL INTAKE & DUPLICATE DETECTION (<200m Proximity Matching)
        ↓
DYNAMIC SLA & SMART PRIORITIZATION ENGINE (Critical 2h, High 6h, Med 24h)
        ↓
WORKER DISPATCH & ROUTE NAVIGATION
        ↓
RESOLUTION EVIDENCE (Before / After Photo Audit & AI Clearance Verification)
        ↓
CITIZEN CONFIRMATION & ANTI-FALSE CLOSURE REOPEN FLOW
        ↓
GEOSPATIAL HOTSPOT CLUSTERING & PREVENTIVE MUNICIPAL PLANNING
```

---

## 2. Multi-Role Architecture

The platform supports 4 distinct civic personas switchable on-the-fly:

1. **Citizen (`Maya Sharma`)**:
   - 30-second guided wizard to report waste with AI vision scanning
   - Real-time status tracking with visual timeline
   - Side-by-side Before/After verification audit
   - 1-click Reopen if cleanup was incomplete
   - Public nearby issues map with privacy anonymization
   - Civic Impact point counter and badges

2. **Sanitation Worker (`Rajan Kumar - Team Alpha`)**:
   - Mobile-first "Today's Work Orders" dashboard sorted by priority & proximity
   - Incident GPS navigation links & citizen instructions
   - Status transitions (`Start Work` → `Complete Resolution`)
   - Mandatory AFTER photo upload with AI clearance comparison check

3. **Supervisor / Municipal Operator (`Marcus Vance`)**:
   - Operational queue with multi-criteria filters
   - Candidate duplicate detection (<200m radius) to prevent double dispatch
   - Priority adjustment & SLA tracking
   - Team assignment to specialized sanitation units

4. **Municipal Administrator / Commissioner**:
   - Command Center KPIs (Total, Open, In Progress, Resolved, Hotspots, SLA compliance)
   - Live GIS Map with color-coded markers and hotspot radar overlays
   - Hotspot Intelligence Engine with transparent mathematical scoring
   - Data-driven preventive recommendations (collection frequency, bin capacity, CCTV/signage, source segregation)
   - SDG 11 & SDG 12 environmental metrics (plastic diverted kg, segregation index)
   - Natural Language Gemini AI advisor for executive municipal queries
   - Immutable security audit logs

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Leaflet GIS mapping
- **Backend API**: Express server running on Node.js / tsx with Vite middlewares
- **AI / Multimodal Vision**: `@google/genai` (Gemini 3.8 Flash model) for:
  - Waste detection, classification & severity estimation
  - Before/After resolution image comparison & clearance audit
  - Natural language municipal telemetry queries
- **GIS & Mapping**: Leaflet with OpenStreetMap tiles, custom SVG markers, draggable pin picker, and hotspot risk zones
- **Security & Authorization**: Role-based access control (RBAC), Firestore Security Rules (`firestore.rules`), immutable audit trail

---

## 4. Key Algorithms

### A. Smart Prioritization Score (0 - 100)
```
Score = Severity Factor (up to 45 pts)
      + Waste Volume Factor (up to 25 pts)
      + Drain Obstruction Bonus (20 pts)
      + Hotspot Recurrence Bonus (5 pts per nearby incident)
      + Aging Escalation (2 pts per 4 hours open)
```
- Score ≥ 75 → `CRITICAL` (2-hour SLA)
- Score ≥ 50 → `HIGH` (6-hour SLA)
- Score ≥ 25 → `MEDIUM` (24-hour SLA)
- Score < 25 → `LOW` (72-hour SLA)

### B. Transparent Hotspot Score (0 - 100)
```
Hotspot Score = Incident Frequency (min(count * 8, 40))
              + Severity Ratio ((critical+high / count) * 25)
              + Recidivism Rate (min(reopened * 10, 20))
              + Resolution Delay Factor (min(avgHours / 2, 15))
```

### C. Duplicate Detection Formula
- Proximity Match: ≤30m (+0.50), ≤100m (+0.35), ≤200m (+0.20)
- Category Match: Exact (+0.30), Related (+0.15)
- Time Recency: <24h (+0.20), <72h (+0.10)
- Score ≥ 0.45 flags incident as a potential duplicate candidate.

---

## 5. Getting Started

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npm test

# 3. Start dev server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 6. Verification & Test Suite

Run the built-in test suite:
```bash
npm test
```
Verifies priority calculation, SLA calculations, duplicate detection, hotspot clustering, and state machine validity.
