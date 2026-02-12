# HVO Fuel Log

Fuel entry and invoice app with Google Sheets backend.

## Local development

1. Install dependencies: `npm install`
2. Create `.env.local` with:
   ```
   VITE_GOOGLE_SHEETS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
3. Run: `npm run dev`
4. Open http://localhost:5173

## Deploy to Vercel (accessible from anywhere)

1. Push your code to GitHub (or connect your repo to Vercel).
2. Go to [vercel.com](https://vercel.com) and import the project.
3. In **Project Settings → Environment Variables**, add:
   - **Name:** `GOOGLE_SHEETS_SCRIPT_URL`
   - **Value:** Your Google Apps Script Web App URL (same as in `.env.local`, e.g. `https://script.google.com/macros/s/.../exec`)
4. Deploy. Vercel will run `npm run build` and serve the app.
5. Use the deployed URL (e.g. `https://your-app.vercel.app`) on both laptop and phone—no Wi‑Fi required.

## Google Sheets setup

- Use the Google Apps Script from the project (paste into your sheet’s Extensions → Apps Script).
- Deploy as Web App with “Anyone” access.
- Put that URL in `VITE_GOOGLE_SHEETS_SCRIPT_URL` (local) and `GOOGLE_SHEETS_SCRIPT_URL` (Vercel).
