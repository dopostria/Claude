# CantSleept Content Factory — Status Document
**Date:** 2026-05-26  
**Repo:** github.com/dopostria/claude  
**Branch:** `cantsleept-iso` (production)  
**Live URL:** https://kantsleepmay.vercel.app  
**Health check:** https://kantsleepmay.vercel.app/api/health  

---

## What It Is
A pixel-art isometric "dungeon" web app for generating viral social media content for the @CantSleept account. Built with Next.js 14 (App Router), deployed on Vercel. The UI is a top-down dungeon with 4 rooms, each representing a stage of the content pipeline.

---

## Architecture

### Stack
- **Frontend:** Next.js 14 App Router, React, TypeScript, CSS (no UI library)
- **Fonts:** Orbitron (labels/headings/buttons) + Share Tech Mono (body/prompts/text content) via Google Fonts
- **AI – Ideas:** Anthropic Claude (claude-opus-4-5 or similar) via `ANTHROPIC_API_KEY`
- **AI – Images:** Higgsfield Soul V2 (`text2image_soul_v2`) via device auth token, OR Google Gemini (fallback)
- **AI – Video:** Higgsfield `grok_video` OR Google Veo 3.1 (`veo-3.1-generate-preview`)
- **Persistence:** Browser `localStorage` (key: `cantsleept_YYYY-MM-DD`)
- **Deployment:** Vercel (auto-deploys from `cantsleept-iso` branch)

### Key Files
```
factory/
├── app/
│   ├── api/
│   │   ├── ideas/           — Generate 10 concepts via Claude
│   │   ├── sessions/        — Session stats + concept prompt generation
│   │   ├── generate-image/  — Higgsfield Soul V2 or Gemini image gen
│   │   ├── generate-video/  — Higgsfield grok_video or Google Veo
│   │   ├── animation-concepts/ — Alternative video concept generation
│   │   ├── chat/            — Dr. Adderall chat overlay
│   │   ├── trends/          — Trend analysis
│   │   ├── health/          — Env var status check
│   │   ├── images/          — Serve tmp images
│   │   └── video-proxy/     — Proxy for Google-hosted videos (auth required)
│   └── globals.css          — All styles + font imports (Orbitron + Share Tech Mono)
├── components/
│   ├── Factory.tsx          — Root component, all state management
│   ├── Sidebar.tsx          — Right sidebar: session log / comms
│   ├── QuickNav.tsx         — Bottom nav buttons
│   ├── overlays/
│   │   ├── IdeasOverlay.tsx     — Browse/select concepts + prompts (has ▸ HISTORY dropdown)
│   │   ├── ImagesOverlay.tsx    — Generate images per concept (has ▸ HISTORY dropdown)
│   │   ├── VideoOverlay.tsx     — Generate video (has ▸ HISTORY dropdown)
│   │   └── ChatOverlay.tsx      — Chat with Dr. Adderall
│   └── rooms/
│       ├── BossRoom.tsx         — Boss room HUD (unused in current dungeon layout)
│       └── IdeasRoom.tsx        — Ideas room HUD (unused in current dungeon layout)
└── lib/
    ├── persistence.ts       — localStorage read/write/loadAllDays
    ├── claude.ts            — Claude prompts (ideas, quality scoring)
    ├── types.ts             — Shared TypeScript types
    └── higgsfield-auth.ts   — Token management + auto-refresh logic
```

### API Models in Use
| Route | Default Provider | Model |
|-------|-----------------|-------|
| `/api/ideas` | Claude | claude-opus-4-5 (or latest) |
| `/api/generate-image` | Gemini | gemini-2.0-flash-exp (fallback chain) |
| `/api/generate-image` | Higgsfield | `text2image_soul_v2` via `fnf.higgsfield.ai` |
| `/api/generate-video` | Google | `veo-3.1-generate-preview` |
| `/api/generate-video` | Higgsfield | `grok_video` via `fnf.higgsfield.ai` |

---

## Environment Variables (Vercel)
| Variable | Status | Notes |
|----------|--------|-------|
| `ANTHROPIC_API_KEY` | ✅ Working | Used for ideas + Dr. Adderall chat |
| `GEMINI_API_KEY` | ✅ Working | Images (default) + Google Veo video |
| `HIGGSFIELD_API_TOKEN` | ⚠️ Expires ~hourly | Device auth token, format: `hf_...` |
| `HIGGSFIELD_REFRESH_TOKEN` | ❌ Currently missing in Vercel | Format: `hfr_...` — needed for auto-refresh |

### Higgsfield Token Rotation (manual process until fixed)
1. On Windows PowerShell: `higgsfield auth login` (if token expired) or read from `~/.config/higgsfield/credentials.json`
2. Update `HIGGSFIELD_API_TOKEN` in Vercel → Settings → Environment Variables
3. Push an empty commit or use Vercel "Redeploy" to pick up new value
4. **Auto-refresh is implemented** in `lib/higgsfield-auth.ts` but requires `HIGGSFIELD_REFRESH_TOKEN` to be set — the refresh endpoint (`fnf-device-auth.higgsfield.ai/refresh`) may not be correct yet (needs verification)

---

## Current Working Features
- ✅ Generate 10 content concepts via Claude (with quality scoring)
- ✅ Browse concepts in IdeasOverlay with setup/punchline/prompts
- ✅ Select concepts and generate image + video prompts
- ✅ Generate images: Higgsfield Soul V2 (character-consistent) or Gemini (free)
- ✅ Generate video: Higgsfield grok_video or Google Veo 3.1
- ✅ Video playback in-app (Higgsfield = direct CloudFront URL, Google = proxied)
- ✅ Download images and videos
- ✅ HISTORY dropdown in every overlay: all days saved in localStorage, click any row to restore session
- ✅ Session restore from history (concepts + prompts + images re-loaded into active session)
- ✅ Dr. Adderall chat overlay with context injection
- ✅ Character hover glows (each sprite has color matching its room)
- ✅ Room glow only during `is-working` state (no glow on done)
- ✅ localStorage persistence (survives page reloads, NOT redeploys to different URLs)
- ✅ Fonts: Orbitron for all labels/UI chrome, Share Tech Mono for readable body text/prompts

---

## UI Layout
```
┌─────────────────────────────┬──────────────┐
│  DUNGEON STAGE (full width) │  COMMS panel │
│  (sprites + dungeon.png bg) │  (session    │
│                             │   log)       │
├─────────────────────────────┤              │
│  QUICKNAV BAR (Ideas/Fotos/ │              │
│  Videos buttons)            │              │
└─────────────────────────────┴──────────────┘
```
History is now accessed via **▸ HISTORY** dropdown button in the top-left of each overlay header — no longer a separate left sidebar.

---

## Known Issues / Limitations

### Higgsfield Token
- Token expires ~hourly; requires manual rotation via Vercel env var + redeploy
- `HIGGSFIELD_REFRESH_TOKEN` is set in Vercel but wasn't being picked up (missing after last redeploy — needs re-verification via `/api/health`)
- The auto-refresh endpoint `/refresh` may not be the correct Higgsfield endpoint (unknown — CLI binary is closed source)
- Long-term fix options: (a) figure out correct refresh endpoint, (b) Windows Task Scheduler script to auto-rotate via Vercel API

### Persistence
- localStorage is browser-specific — data doesn't transfer between devices or browsers
- If accessing via a new Vercel deployment URL (not the stable `kantsleepmay.vercel.app`), localStorage will be empty
- Images stored as base64 in localStorage — may hit quota on many large images (trimmed to last 3 if quota exceeded)

### Video
- Higgsfield `grok_video`: 3-second clips only
- Google Veo 3.1: 8-second clips but ~7 min generation time; requires Gemini API access to `veo-3.1-generate-preview`
- Video URLs from Higgsfield (CloudFront) are temporary — not permanently saved

### General
- No user authentication — single-user app
- No server-side database — all state in browser localStorage
- Concepts generated once per day (keyed by date)

---

## Potential Next Steps (to discuss)

### High Priority
1. **Fix Higgsfield refresh token** — verify correct endpoint, or build Windows auto-rotation script using Vercel API
2. **Persistent video storage** — CloudFront URLs expire; need to download and store videos (R2/S3/Supabase)
3. **Cross-device sync** — replace localStorage with a real backend (Supabase, PlanetScale, etc.)

### Feature Ideas
4. **Scheduler / publishing** — auto-post to TikTok/Instagram/YouTube Shorts
5. **Batch generation** — generate all 10 concept images in one click
6. **Character library** — save and reuse Soul V2 character seeds for consistency
7. **Trend injection** — pull real-time trends into concept generation (trends API exists but unused)
8. **Caption / text overlay** — add captions to generated videos
9. **Multiple accounts** — support other creators beyond @CantSleept
10. **Mobile view** — current layout is desktop-only

### Technical Debt
- Remove debug commits from git history (empty "trigger redeploy" commits)
- Add proper error boundaries in React
- The `cantsleept-iso` branch name is confusing — consider renaming to `main` or `production`
- `.env.local.example` still references old `HIGGSFIELD_API_KEY` variable name (should be `HIGGSFIELD_API_TOKEN`)
- `rooms/BossRoom.tsx` and `rooms/IdeasRoom.tsx` are unused dead code (dungeon uses sprite PNG + CSS, not these React components)
