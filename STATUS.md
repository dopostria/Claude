# CantSleept Content Factory — Status Document
**Date:** 2026-05-27  
**Repo:** github.com/dopostria/Claude  
**Branch:** `cantsleept-iso` (production)  
**Live URL:** https://kantsleepmay.vercel.app  
**Health check:** https://kantsleepmay.vercel.app/api/health  
**Current HEAD:** `7c0a52e` (GitHub session storage + PROMPTS tab)

---

## What It Is
A pixel-art isometric "dungeon" web app for generating viral social media content for the @CantSleept account. Built with Next.js 14 (App Router), deployed on Vercel. The UI is a top-down dungeon with 4 rooms, each representing a stage of the content pipeline.

---

## Architecture

### Stack
- **Frontend:** Next.js 14 App Router, React, TypeScript, CSS (no UI library)
- **Fonts:** Orbitron (labels/headings/buttons) + Share Tech Mono (body/prompts) via Google Fonts
- **AI – Ideas:** Anthropic Claude (`claude-sonnet-4-6`) via `ANTHROPIC_API_KEY`
- **AI – Images:** Higgsfield (`nano_banana_2`) OR Google Gemini (`gemini-2.0-flash-exp`) fallback
- **AI – Video:** Google Veo 3.1 (`veo-3.1-generate-preview`) OR Higgsfield `grok_video`
- **Persistence (concepts/prompts/videos):** GitHub file `factory/data/sessions.json` via `/api/history`
- **Persistence (images):** Browser `localStorage` key `cantsleept_img_YYYY-MM-DD`
- **Deployment:** Vercel (auto-deploys from `cantsleept-iso` branch)

### Key Files
```
factory/
├── app/
│   ├── api/
│   │   ├── ideas/           — Generate 10 concepts via Claude
│   │   ├── sessions/        — Session stats + concept prompt generation
│   │   ├── history/         — GET/POST GitHub-backed session storage (NEW)
│   │   ├── generate-image/  — Higgsfield nano_banana_2 or Gemini image gen
│   │   ├── generate-video/  — Higgsfield grok_video or Google Veo
│   │   ├── chat/            — Dr. Adderall chat overlay
│   │   ├── trends/          — Trend analysis
│   │   ├── health/          — Env var status check
│   │   └── video-proxy/     — Proxy for Google-hosted videos (auth required)
│   └── globals.css          — All styles + font imports
├── components/
│   ├── Factory.tsx          — Root component, all state + GitHub history load/save
│   ├── Sidebar.tsx          — Right sidebar: session log
│   ├── QuickNav.tsx         — Bottom nav buttons
│   └── overlays/
│       ├── IdeasOverlay.tsx     — [IDEAS] / [PROMPTS] tabs; HISTORY dropdown (GitHub)
│       ├── ImagesOverlay.tsx    — Generate images; HISTORY dropdown (GitHub)
│       ├── VideoOverlay.tsx     — Generate video; HISTORY dropdown (GitHub)
│       └── ChatOverlay.tsx      — Chat with Dr. Adderall
├── data/
│   ├── sessions.json        — Permanent history storage (NEW, in-repo GitHub file)
│   ├── brand_context.json   — Archetypes, humor engines, quality filters
│   └── trend_feed.json      — Current Bolivian trends (updated via /api/trends)
└── lib/
    ├── session-types.ts     — GitHubSession interface (NEW, shared client+server)
    ├── github-storage.ts    — readSessions() / upsertSession() via GitHub API (NEW)
    ├── persistence.ts       — Images-only localStorage (REWRITTEN, images only)
    ├── claude.ts            — Claude prompts (ideas, quality scoring, prompts)
    ├── types.ts             — Shared TypeScript types
    └── higgsfield-auth.ts   — Token management + auto-refresh logic
```

### API Models in Use
| Route | Provider | Model |
|-------|----------|-------|
| `/api/ideas` | Claude | claude-sonnet-4-6 |
| `/api/sessions` (prompts) | Claude | claude-sonnet-4-6 |
| `/api/generate-image` | Higgsfield | `nano_banana_2` |
| `/api/generate-image` | Gemini (fallback) | `gemini-2.0-flash-exp` |
| `/api/generate-video` | Google | `veo-3.1-generate-preview` |
| `/api/generate-video` | Higgsfield | `grok_video` (3s clips, 9:16) |
| `/api/history` (GET/POST) | GitHub API | Contents API on `sessions.json` |

---

## Environment Variables (Vercel)
| Variable | Status | Notes |
|----------|--------|-------|
| `ANTHROPIC_API_KEY` | ✅ Working | Ideas + Dr. Adderall chat |
| `GEMINI_API_KEY` | ✅ Working | Images (fallback) + Google Veo video |
| `HIGGSFIELD_API_TOKEN` | ⚠️ Expires ~hourly | Format `hf_...`; auto-refresh attempted |
| `HIGGSFIELD_REFRESH_TOKEN` | ✅ Set | Format `hfr_...`; enables auto-refresh in `higgsfield-auth.ts` |
| `GITHUB_TOKEN` | ✅ Set | PAT for reading/writing `factory/data/sessions.json` |

---

## How Persistence Works Now

### Two-layer system:
1. **GitHub (`factory/data/sessions.json`)** — permanent, cross-device, cross-browser
   - Stores: concepts, selectedConceptIds, imagePrompts, videoPrompts, videos[]
   - Loaded on every page mount via `GET /api/history`
   - Saved 2s after any change via `POST /api/history` (debounced)
   - Keeps up to 60 sessions, newest first
   - Never loses data even on Vercel cold starts
   
2. **localStorage (`cantsleept_img_YYYY-MM-DD`)** — today's images only
   - Stores: generated images as base64 (today only)
   - Saves immediately on image generation
   - Lost if browser storage cleared or on new browser/device
   - On page load: checks localStorage AFTER GitHub restore

### On page load sequence:
```
fetch /api/history → find today's session → restore concepts/prompts/videos
→ finally: loadImages(today) from localStorage → setIsRestored(true)
→ save effect activates
```

---

## Current Working Features
- ✅ Generate 10 content concepts via Claude (with quality scoring + trend injection)
- ✅ Browse concepts in IdeasOverlay with setup/punchline display
- ✅ **[IDEAS] / [PROMPTS] tab** in IdeasOverlay:
  - IDEAS: concept cards with select + expand-prompts per card
  - PROMPTS: all prompts from ALL sessions grouped by date, each with COPY button
- ✅ Select concepts and generate image + video prompts
- ✅ Generate images: Higgsfield nano_banana_2 or Gemini (free)
- ✅ Generate video: Higgsfield grok_video (3s) or Google Veo 3.1 (8s, ~7min)
- ✅ Video playback in-app (Higgsfield = direct CloudFront URL, Google = proxied)
- ✅ Download images and videos
- ✅ **HISTORY dropdown in every overlay** now backed by GitHub (permanent, cross-device)
- ✅ Session restore from history (concepts + prompts + videos; images NOT restored from history)
- ✅ Dr. Adderall chat overlay with context injection into idea generation
- ✅ Image compression before video request (prevents Vercel 4.5MB body limit 413 error)
- ✅ Higgsfield grok_video: correct upload flow + start frame (medias[] in params)
- ✅ Local date key for Bolivia timezone (UTC-4)

---

## Known Issues / Pending Work

### 🔴 Rate Limit (Anthropic API)
- Error: `429 rate_limit_error — 30,000 input tokens/minute exceeded`
- Cause: ideas system prompt is large (brand_context + trend_feed + history = 8-15k tokens); 2-3 rapid calls hit the limit
- **Workaround:** wait ~60 seconds and retry
- **Pending fix:** add retry-with-backoff in `lib/claude.ts` for 429 errors (2 retries, 15s wait each)
  - Show user: "Rate limit — esperando 15s..." instead of raw error

### 🟡 Higgsfield Token
- Token expires ~hourly; `HIGGSFIELD_REFRESH_TOKEN` is set but refresh endpoint correctness unverified
- Manual rotation: update `HIGGSFIELD_API_TOKEN` in Vercel env vars → redeploy

### 🟡 Image History
- Images are NOT stored in GitHub (too large) — only in localStorage for TODAY
- Restoring a historical session from HISTORY dropdown loads concepts+prompts+videos but NOT images
- User must regenerate images after restoring a past session

### 🟡 Video URL Expiry
- Higgsfield CloudFront video URLs are temporary (may expire in hours/days)
- Restored videos from history may have dead links
- Long-term fix: download and store to R2/S3/Supabase

### 🟢 Minor Technical Debt
- `rooms/BossRoom.tsx` and `rooms/IdeasRoom.tsx` are unused dead code
- `.env.local.example` still references old `HIGGSFIELD_API_KEY` name (should be `HIGGSFIELD_API_TOKEN`)
- `lib/storage.ts` (server-side SQLite/JSON storage) still exists but is no longer the primary persistence layer

---

## Next Session — Suggested Tasks

### Immediate (small, high value)
1. **Retry logic for 429** in `lib/claude.ts`:
   - Catch 429 responses, wait 15s, retry up to 2 times
   - Show "Rate limit — reintentando en 15s..." in session log
   - File to edit: `factory/lib/claude.ts` (the `callClaude` / fetch wrapper)

2. **Verify HISTORY works end-to-end** — generate ideas, close browser, reopen, confirm concepts+prompts appear

### Medium Priority
3. **Image storage option** — store today's images to a GitHub gist or Vercel Blob so they survive beyond localStorage
4. **Prompt length reduction** — audit `brand_context.json` to see if it can be trimmed to reduce token usage

### Longer Term
5. Scheduler / publishing (TikTok/Instagram auto-post)
6. Batch image generation (all 10 concepts at once)
7. Video URL persistence (R2/S3 download + store)

---

## Git / Deploy Reference
| Commit | Description | Status |
|--------|-------------|--------|
| `7c0a52e` | GitHub session storage + PROMPTS tab + images-only localStorage | ✅ LIVE |
| `93d6aae` | Higgsfield grok_video upload flow + start frame fix | ✅ LIVE (superseded) |
| `fd72b2d` | localStorage date bug + selectedImageId + quota fix | ✅ LIVE (superseded) |
| `ab5a715` | Remove stale animation_concepts TS build error | ✅ LIVE (superseded) |

**Deploy protocol:** push to `cantsleept-iso` → Vercel auto-builds → ~2min to READY  
**Atomic commits:** use GitHub Trees API (blob → tree → commit → ref) to avoid partial deploys  
**Vercel project ID:** `prj_BFpuezMK0X8UxXno07O48IqL6Q0r`  
**GitHub repo ID:** `1174773494`
