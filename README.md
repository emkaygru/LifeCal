# LifeCal (prototype)

This is a small React + Vite prototype for a shared family dashboard: calendar (public Apple Calendar iCal), todos, grocery list, meal planner, and a drawing "sticky note".

Quick start

1. Install dependencies

```bash
npm install
```

2. Run dev server

```bash
npm run dev
```

Notes
- To sync a public Apple Calendar, paste your public calendar iCal URL into `src/components/CalendarView.tsx` at the `PUBLIC_ICAL_URL` constant.
- Data is persisted to localStorage for this prototype (todos, groceries, meals, sticky-note image).
- Owner colors: Steph = forest green (#0b6623), Emily = electric blue (#00a2ff), Maisie = lavender purple (#b57edc).

Server proxy for webcal/private calendars

If you need to fetch `webcal://` or private iCloud calendar links (to avoid CORS or if the browser can't fetch directly), you can run the simple server in `server/` which exposes a `/fetch-ical?url=...` endpoint.

Run:

```bash
cd server
npm install
npm start
```

Then in `CalendarView.tsx` you can replace the public URL usage with `http://localhost:4000/fetch-ical?url=${encodeURIComponent(YOUR_URL)}` so the server will proxy the iCal.

Recipe suggestions (optional)

This prototype can query Spoonacular for recipe suggestions to suggest ingredients. To enable it, set the environment variable `SPOONACULAR_KEY` when starting the server in `server/`:

```bash
export SPOONACULAR_KEY=your_key_here
node index.js
```

When enabled, typing in the Grocery input will show recipe suggestions returned from the API and allow adding recipe ingredients to the grocery list.

Next steps (I can implement on request):
- OAuth or server-based calendar sync to securely read private calendars.
- Drag-and-drop layout customization, grid placement and save.
- Better calendar UI (day/week view, event editing), and shared realtime sync (Firebase, Supabase).
