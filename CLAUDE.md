# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Summary

StaffHub UNS Pro is a personnel management system for Universal Kikaku Co., Ltd., a Japanese staffing company managing ~400 foreign workers (primarily Vietnamese). The app handles two staff types:
- **GenzaiX** (現在X) - Dispatched/派遣 workers sent to client companies
- **Ukeoi** (請負) - Contract workers employed directly

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build to /dist
npm run preview      # Preview production build
```

## Architecture

**Client-Side SPA**: All data persists locally in IndexedDB via Dexie.js. No backend server.

### Key Files
| File | Purpose |
|------|---------|
| `App.tsx` | Main hub with sidebar navigation, modal forms, state-based routing |
| `db.ts` | Dexie database schema (v6) - staff, resumes, applications, factories, settings |
| `types.ts` | TypeScript interfaces for all data models |
| `constants.tsx` | Field definitions for GenzaiX/Ukeoi tables, company info, branding |

### Component Architecture
- **Data Tables**: `StaffTable.tsx` renders both GenzaiX and Ukeoi views based on staff `type`
- **Forms**: `StaffForm.tsx` for employee CRUD, `RirekishoForm.tsx` (35KB) for resume editing
- **Print**: `RirekishoPrintView.tsx` generates Japanese-format resumes for printing
- **AI**: `AISummary.tsx` displays Gemini-generated personnel insights
- **Backup**: `DatabaseManager.tsx` handles export to SQLite and restore from JSON

### Services Layer (`services/`)
- `gemini.ts` - AI text analysis using `gemini-3-pro-preview`
- `ocr.ts` - Document OCR and face cropping using Gemini vision models
- `sqliteService.ts` - Exports Dexie data to downloadable SQLite file

## Database Schema

Five tables in IndexedDB (Dexie v6):
- `staff` - Employee records with 50+ fields (personal, financial, visa, insurance)
- `resumes` - CV/Rirekisho records for applicants
- `applications` - Hiring workflow tracking
- `factories` - Job site/dispatch location data
- `settings` - Key-value store for user profile and config

When modifying schema, update both `db.ts` and `services/sqliteService.ts` to maintain export consistency.

## Data Patterns

- Use `useLiveQuery()` from `dexie-react-hooks` for reactive data binding
- Staff records have a `type` field: `'GenzaiX'` or `'Ukeoi'` (PascalCase)
- `resumeId` on staff links to resumes table
- `isShaku` boolean indicates company housing (社宅)
- Financial fields: `hourlyWage`, `billingUnit`, `profitMargin`, `standardRemuneration`
- Insurance deductions: `healthIns`, `nursingIns`, `pension`

## AI Integration

Requires `GEMINI_API_KEY` in `.env.local`. Models used:
- `gemini-3-pro-preview` - Personnel data analysis
- `gemini-3-flash-preview` / `gemini-2.5-flash-image` - OCR and image processing

AI client is instantiated on-demand in each function to pick up API key changes.

## Navigation

State-based routing in `App.tsx` via `activeView`:
- `dashboard` | `genzaix` | `ukeoi` | `resumes` | `applications` | `ai` | `database` | `profile`

Add new views by: creating component, adding case in App.tsx render, adding sidebar entry.

## Styling

- Tailwind CSS via CDN (see `index.html`)
- Corporate colors: Blue `#0052CC`, Red `#DC143C` (defined in `constants.tsx`)
- Fonts: Inter (UI), Noto Sans JP (Japanese text)
- Icon libraries: Lucide React, Heroicons

## Security Considerations

**API Key Exposure**: The Gemini API key is embedded in the client-side bundle via `vite.config.ts`. This is visible in browser DevTools. Mitigations:
1. Use API key restrictions in Google Cloud Console (restrict by HTTP referrer)
2. Set usage quotas/limits on the API key
3. For production: consider a backend proxy to hide the key

**Data Privacy**: All employee data (including sensitive visa, banking, insurance info) is stored in browser IndexedDB. This data is:
- Not encrypted at rest
- Accessible to anyone with physical access to the machine
- Not synced across devices

## Legacy Data

Python scripts in root for one-time data migration:
- `migrate_access.py` - Import from MS Access
- `extract_attachments.py` / `fix_photos.py` - Photo extraction and processing
- Employee photos stored in `public/photos/`
