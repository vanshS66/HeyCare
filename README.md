# HeyCare

HeyCare is a voice-first medical documentation assistant. It helps a clinician turn a consultation into an editable, structured patient note: record the conversation, review the live transcript, let AI extract the relevant details, and save or export the finished record.

> **Important:** HeyCare is a documentation aid, not a diagnostic or clinical-decision system. Review every generated field before saving or acting on it. The current Supabase policies allow public access to patient records; do not use this deployment with real patient information until authentication, access controls, and appropriate privacy/security safeguards have been implemented.

## What it does

- Captures clinician-patient conversations through the browser microphone.
- Shows a live, in-browser transcript while recording.
- Uses AI to pre-fill patient details, symptoms, history, diagnosis, treatment plan, and vital signs.
- Keeps both the raw transcript and an AI-formatted, speaker-labelled version.
- Lets users review and edit every field before saving.
- Stores patient notes in Supabase, with search, view, edit, deletion, and export workflows.

## How the app works

```text
Microphone
    ↓
Browser Web Speech API → live transcript in the Record tab
    ↓ (Pause or Stop)
Supabase Edge Function: analyze-transcript
    ↓
OpenRouter / gpt-4o-mini → structured JSON + speaker-labelled transcript
    ↓
Editable Patient Info form
    ↓
Supabase patients table → Notes list → view, edit, delete, or export
```

### 1. Record a consultation

The **Record** tab uses the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with US English recognition. It requests microphone access, displays interim and finalized speech as it arrives, and restarts recognition after a normal recognition session ends so recording can continue.

- **Start** begins a new transcript.
- **Pause** stops recognition temporarily and may request AI formatting of the transcript collected so far.
- **Resume** continues the same transcript.
- **Stop** finalizes the transcript and begins the full extraction flow.

Speech recognition support varies by browser. Chrome, Edge, and Safari are the intended browsers; unsupported browsers show an in-app warning.

### 2. Analyze and structure the transcript

When a recording is paused or stopped, the frontend invokes the Supabase Edge Function named `analyze-transcript`. The function validates its transcript input, calls OpenRouter's chat-completions API with `gpt-4o-mini`, and requests JSON containing the note fields plus a transcript marked with inferred `Doctor:` and `Patient:` speakers.

For a completed recording, HeyCare uses the returned values to populate the patient record, but does not replace existing manual values when the AI response is `N/A`. If analysis fails, the raw transcript is retained so the clinician can complete the form manually.

### 3. Review the patient note

The **Patient Info** tab is the review-and-edit step. It holds:

- Patient name, age, and gender
- Symptoms / chief complaint
- Medical history, including conditions, medications, and allergies mentioned in the conversation
- Diagnosis and treatment plan
- Vitals: blood pressure, heart rate, temperature, respiratory rate, oxygen saturation, weight, and height
- Raw and formatted transcripts

The form is fully editable. A patient name is required before a note can be saved.

### 4. Save and manage records

Saving creates a new row in Supabase's `patients` table; editing an existing record updates that row. When the app loads, it retrieves records in newest-first order and maps database columns to the patient-note model.

The **Notes** tab provides a records dashboard where users can:

- Search by patient name, symptoms, or diagnosis
- Open a read-only patient view
- Return to the form to edit a saved record
- Delete a record after confirmation
- Download a plain-text report or a printable HTML report, which can be printed to PDF

Starting a new recording while a note has unsaved content prompts the user to save or discard the current work.

## Architecture

| Area | Implementation |
| --- | --- |
| Frontend | React 18, TypeScript, and Vite |
| Styling and components | Tailwind CSS, shadcn/ui, Radix UI, and Lucide icons |
| Routing and state helpers | React Router and TanStack Query |
| Speech-to-text | Browser Web Speech API |
| Data store and backend entry point | Supabase (`patients` table and Edge Functions) |
| AI extraction | OpenRouter chat completions using `gpt-4o-mini` |

Key code locations:

- `pages/Index.tsx` — orchestrates recording, AI analysis, patient editing, and note management.
- `VoiceRecorder.tsx` — microphone permission and Web Speech API lifecycle.
- `PatientForm.tsx` — editable clinical record fields.
- `NotesManager.tsx` and `PatientView.tsx` — searching, viewing, exporting, and deleting notes.
- `supabase/functions/analyze-transcript/index.ts` — transcript extraction Edge Function.
- `supabase/migrations/` — Supabase policy migrations.

## Run locally

### Prerequisites

- Node.js 18 or later
- npm
- A browser with Web Speech API support and microphone access (Chrome, Edge, or Safari)
- Access to the configured Supabase project and an `OPENROUTER_API_KEY` secret on its Edge Function for AI extraction

### Commands

```bash
npm install
npm run dev
```

Open the local URL Vite prints, then approve the browser's microphone permission request.

Other commands:

```bash
npm run lint
npm run build
npm run preview
```

## Supabase and AI configuration

The checked-in client currently points at a Supabase project in `integrations/supabase/client.ts`. The `analyze-transcript` function reads the OpenRouter credential from the Supabase environment variable `OPENROUTER_API_KEY`; it is intentionally not stored in the repository.

For a separate deployment, configure a Supabase project with a compatible `patients` table, update the frontend client configuration, deploy `supabase/functions/analyze-transcript`, and set `OPENROUTER_API_KEY` as an Edge Function secret. Apply and review the migrations in `supabase/migrations/` before exposing the database—those policies currently permit unauthenticated public reads and writes.

## Contributors

- [Vansh](https://github.com/vanshS66)
- [Thanush](https://github.com/ThanushSupra)
- [Het](https://github.com/nothetpatel)
- [Isaac Tilahun](https://github.com/IsaacTilahun)
- [Parth](https://github.com/ParthD77)
