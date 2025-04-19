# Trading Backtest Tracker

A frontend-only application for tracking and visualizing daily trading backtest progress. This application allows you to enter data for your trading backtests and track your progress with a minimum goal of 5 backtests per day.

## Features

- Record detailed backtest data:
  - Date of backtest
  - Liquidity sweep information
  - Swing formation time
  - Obviousness rating (1-10)
  - MSS timing details
  - Protected swing data
  - Price expansion data
  - Pip measurements
- Calendar view to visualize daily backtest completion
- Burndown chart to track progress over time

- Responsive UI that works on both desktop and mobile

## How to Run Locally

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
   This will install all required packages, including `@supabase/supabase-js`.
3. Copy and configure your environment variables. Create a `.env.development` file (or use the provided one) with the following:
   ```env
   VITE_SUPABASE_URL=<your-supabase-project-url>
   VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
   ```
   Example:
   ```env
   VITE_SUPABASE_URL=https://xyzcompany.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open the application in your browser at `http://localhost:5173`.

## Database (Supabase Backend)

All data is now persisted remotely using [Supabase](https://supabase.com/) as the backend database. Local JSON export/import and sync features have been removed.

**Environment Variables:**
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon public key

**Example `.env.development`**
```env
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

**Database Migration:**
- To set up the required tables, run:
  ```
  supabase db push
  ```
  or manually execute the SQL in `supabase/migrations/20250419_create_backtests_and_analyses.sql` via the Supabase dashboard.

## Data Persistence

- All user data is stored securely and remotely in your Supabase database.
- There is no longer any local JSON file sync or import/export. Data is always up-to-date and available across devices.

## Deployment

To deploy this app (e.g. to GitHub Pages or another static host):

1. Build the project:
   ```
   npm run build
   ```
2. Serve or deploy the `dist/` directory as needed.

---

**Note:**
- Make sure your `.env.production` is configured for production deployments.
- For more details on Supabase setup, see the [Supabase docs](https://supabase.com/docs).

4. Run the deploy command:
   ```
   npm run deploy
   ```

## Data Persistence

This application doesn't use a backend server. Data is persisted in the following ways:

1. **Local Storage**: All backtest data is automatically saved to your browser's local storage.
2. **JSON Export/Import**: For long-term data storage or sharing with others, use the Export feature to download your data as a JSON file. You can then import this JSON file anytime to restore your data.

To update your tracker:
1. Export your data to JSON
2. Commit and push the JSON file to your GitHub repository
3. Import the JSON file when needed

## License

MIT
