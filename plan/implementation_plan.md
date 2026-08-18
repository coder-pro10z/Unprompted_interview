# MVP Implementation Plan: Unprompted AI Speaking Coach

This plan outlines the steps to build the smallest, fastest version of the website as described in the provided document. We will use a standard React + Express setup to leverage the exact code snippets provided in your plan.

## User Review Required

> [!IMPORTANT]
> **API Key:** The backend requires a Gemini API key to function. I will need you to provide the `GEMINI_API_KEY` as an environment variable when running the server, or you can supply it in a `.env` file later.

## Proposed Architecture

We will create two separate folders in the current directory (`c:/Users/Praveen/Desktop/Unprompted_interview`):

1.  **`backend/`**: A Node.js Express server to handle media uploads and communicate with the Gemini API.
2.  **`frontend/`**: A Vite + React application containing the UI and the speech recording logic.

---

### Backend (Node.js + Express)

We will initialize a basic Node.js project and install `express`, `multer`, `cors`, and `@google/genai`.

#### [NEW] `backend/server.js`
The server implementation provided in the document. It exposes a `POST /api/review-speech` endpoint that takes the media blob and topic, and returns structured AI feedback using Gemini 1.5 Flash.

#### [NEW] `backend/package.json`
Configuration to run the backend and list dependencies.

---

### Frontend (Vite + React)

We will bootstrap a React app using `npx create-vite@latest frontend --template react`.

#### [NEW] `frontend/src/useSpeechSession.js`
The custom hook from the document that manages the `MediaRecorder`, precision timer, and API communication.

#### [NEW] `frontend/src/UnpromptedCoach.jsx`
The main React component from the document containing the UI, camera overlay, topic spinner, and feedback presentation.

#### [MODIFY] `frontend/src/App.jsx`
Updated to render `<UnpromptedCoach />`.

#### [MODIFY] `frontend/src/index.css`
We will add basic styling (dark theme, Fraunces font, button styles, timer overlays) to match the layout required by `UnpromptedCoach.jsx`.

## Verification Plan

### Automated Tests
*   Ensure both frontend (`npm run dev`) and backend (`node server.js`) start without errors.

### Manual Verification
*   You will need to run both the frontend and backend servers.
*   You will be asked to open the frontend in your browser, allow camera/microphone permissions, and record a 1-minute test speech.
*   We will verify if the frontend successfully sends the blob to the backend, and if the backend returns the structured AI feedback.
