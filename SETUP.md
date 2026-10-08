# CleanCity Setup & Deployment Guide

This guide walks through configuring CleanCity / WasteWatch in development and production environments.

---

## 1. Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key (for AI vision and natural language query features)

---

## 2. Environment Variables

Create a `.env` file in the project root:

```bash
# GEMINI_API_KEY: Used by backend server for Gemini 3.8 Flash multimodal vision
GEMINI_API_KEY="your_gemini_api_key_here"

# PORT: Server listening port (default 3000)
PORT=3000

# NODE_ENV: development | production
NODE_ENV=development
```

> **Note:** If `GEMINI_API_KEY` is omitted, CleanCity automatically falls back to its built-in intelligent heuristic vision simulator so that evaluations and hackathon demos never crash.

---

## 3. Running the App Locally

```bash
# Install dependencies
npm install

# Run the unit test suite
npm test

# Launch the full-stack server
npm run dev
```

Open `http://localhost:3000`.

---

## 4. Firebase Production Setup (Optional)

If connecting to Google Cloud Firestore in production:

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** in test/production mode.
3. Enable **Firebase Authentication** (Email/Password or Anonymous).
4. Deploy the security rules provided in this repository:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Deploy storage rules for evidence uploads (`reports/{id}/*` and `evidence/{id}/*`).

---

## 5. 3-Minute Hackathon Demo Script

1. **Step 1: Citizen Discovery**
   - Click "Guided Demo Tour" in the top bar or switch to the **Citizen** tab.
   - Click **"Report Waste"**.
   - Select **Preset 1 (Overflowing Bin)**.
   - Watch the AI Multimodal Scanner analyze the image, classify category, estimate volume, and assign severity.
   - Confirm location on the interactive map and submit. Note the generated Report ID (e.g. `SW-2026-000187`).

2. **Step 2: Supervisor Intake & Duplicate Detection**
   - Switch to **Supervisor** role.
   - Open the **Incident Queue** and locate the new report.
   - Review the candidate duplicates panel (<200m proximity).
   - Click **Verify Incident** and **Assign Team Alpha (Rajan Kumar)**.

3. **Step 3: Worker Field Execution**
   - Switch to **Field Worker** role.
   - View **Today's Work Orders**.
   - Open the assigned order, tap **Start Work**.
   - Tap **Complete Resolution**, select the spotless clean photo preset.
   - Observe the **AI Comparative Visual Check** confirming debris removal.
   - Submit for Citizen Audit.

4. **Step 4: Citizen Verification & Reopen Prevention**
   - Switch back to **Citizen** role.
   - Open **My Reports**.
   - Review side-by-side Before/After photos.
   - Tap **"Yes, Verified Clean"** (or test the "No, Still Present" anti-false closure reopen flow).

5. **Step 5: Hotspot Intelligence & Prevention**
   - Switch to **Admin** role.
   - Click **Hotspot Intelligence & Preventive Planning**.
   - Review the 0-100 mathematical scoring breakdown and data-driven preventive interventions (bin capacity upgrades, CCTV enforcement, segregation hubs).
   - Inspect **SDG 11 & SDG 12 Analytics** for diverted plastic kilograms and response acceleration.
