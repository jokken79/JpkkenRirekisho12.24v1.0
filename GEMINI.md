# StaffHub UNS Pro - GEMINI.md

## Project Overview

**StaffHub UNS Pro** is a comprehensive personnel management system designed for managing internal ("GenzaiX") and contract ("Ukeoi") staff. It features a modern React-based frontend, client-side database management, and AI-powered capabilities for insights and document processing.

### Key Technologies
- **Frontend:** React 19, Vite, TypeScript
- **Styling:** Tailwind CSS (inferred from usage), Lucide React (icons)
- **Database:** Dexie.js (IndexedDB wrapper) for local storage
- **Export/Backup:** sql.js for generating SQLite database exports
- **AI & ML:** Google Gemini API (`@google/genai`) for:
    - **Insights:** Strategic analysis of personnel data.
    - **OCR:** Extracting data from residence cards and other documents.
    - **Image Processing:** Face cropping from ID cards.

### Architecture
The application runs entirely on the client-side (Single Page Application). Data is persisted locally using IndexedDB via Dexie.js. It supports exporting the local database to a SQLite file for backup or external analysis.

## Directory Structure

- **`src/`** (Root source files are in the top-level directory in this setup)
    - **`App.tsx`**: Main application component handling layout, navigation state, and high-level view switching.
    - **`db.ts`**: Dexie database schema definition (`StaffHubDB`). Defines tables for `staff`, `resumes`, and `settings`.
    - **`index.tsx`**: Entry point rendering the React application.
    - **`types.ts`**: TypeScript type definitions for the project entities.
- **`components/`**: Reusable React components.
    - `Dashboard.tsx`: Main dashboard view.
    - `StaffTable.tsx`, `StaffForm.tsx`: CRUD for staff members.
    - `ResumeList.tsx`, `RirekishoForm.tsx`: CRUD for resumes/CVs.
    - `AISummary.tsx`: Component displaying AI-generated insights.
    - `DatabaseManager.tsx`: UI for database backup/restore operations.
- **`services/`**: Integration and utility services.
    - `gemini.ts`: Functions for interacting with the Gemini API for text analysis (`getStaffInsights`).
    - `ocr.ts`: Functions for OCR and image manipulation using Gemini (`processDocumentOCR`, `cropFaceFromDocument`).
    - `sqliteService.ts`: Logic to bridge Dexie data to a SQLite database file using `sql.js` for export.

## Branding & Assets

*   **Logo:** The application logo is stored locally at `public/logo.png`.
*   **Company Information:** Key company details (Name, Address, Colors) are defined in `src/constants.tsx` under `COMPANY_INFO` for easy access throughout the application.
*   **Design System:** The UI follows the corporate color palette defined in the company guidelines (Blue `#0052CC`, Red `#DC143C`).

## Building and Running

### Prerequisites
- Node.js (v18+ recommended)
- A Google Gemini API key (set in `.env.local`)

### Commands

*   **Install Dependencies:**
    ```bash
    npm install
    ```

*   **Start Development Server:**
    ```bash
    npm run dev
    ```

*   **Build for Production:**
    ```bash
    npm run build
    ```

*   **Preview Production Build:**
    ```bash
    npm run preview
    ```

## Development Conventions

*   **State Management:** The app uses local React state (`useState`) for UI state and `dexie-react-hooks` (`useLiveQuery`) for reactive database data binding.
*   **Routing:** Currently uses a custom state-based routing mechanism (`activeView` state in `App.tsx`) rather than a library like `react-router`.
*   **AI Integration:**
    - AI calls are stateless and instantiate the `GoogleGenAI` client on demand to ensure the latest API key is used.
    - Error handling is implemented to fail gracefully if the API is unavailable.
    - **Models:** Uses `gemini-3-pro-preview` for analysis and `gemini-3-flash-preview`/`gemini-2.5-flash-image` for vision tasks.
*   **Database Schema:**
    - `staff`: Stores employee details.
    - `resumes`: Stores applicant data, including JSON fields for complex history (education, jobs, etc.).
    - `settings`: Key-value store for app configuration (e.g., current user profile).

## Configuration

*   **Environment Variables:**
    - `GEMINI_API_KEY`: Required for AI features to function. Should be placed in `.env.local`.

## Notes for AI Agents

*   When modifying database schemas, ensure both `db.ts` (Dexie) and `services/sqliteService.ts` (SQLite export) are updated to maintain consistency during backups.
*   The `App.tsx` file acts as the central hub for navigation. Add new "pages" by creating a new view component and adding a corresponding state in `activeView`.
*   Styling relies on utility classes. Maintain consistency with the existing color palette (Slate/Blue) and spacing.
