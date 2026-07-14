# NenkinPro

NenkinPro is a professional platform for managing Nenkin (Japanese pension) refund applications.

## Requirements
- Node.js (v18 or higher)
- npm (v9 or higher)

## Local Setup

1. **Environment Variables**
   Copy the example environment file to create your local config:
   ```bash
   cp .env.example .env.local
   ```
   **WARNING: Never commit `.env.local` to version control. It contains sensitive credentials.**

   *Environment Variables Explanation (DO NOT PUT REAL VALUES IN .env.example):*
   - `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase project (used by frontend).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for Supabase (used by frontend).
   - `DATABASE_URL`: Connection string for Prisma to access the PostgreSQL database.
   - `DIRECT_URL`: Direct connection string for Prisma migrations.
   - `GEMINI_API_KEY`: API key for Gemini OCR processing.

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Development Commands**
   - Start the development server:
     ```bash
     npm run dev
     ```
   - Run linter:
     ```bash
     npm run lint
     ```
   - Build for production:
     ```bash
     npm run build
     ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
