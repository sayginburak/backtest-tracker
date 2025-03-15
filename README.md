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
- Export/Import data as JSON (for GitHub Pages data persistence)
- Responsive UI that works on both desktop and mobile

## How to Run Locally

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open the application in your browser at `http://localhost:5173`

## Deployment to GitHub Pages

To deploy this app to GitHub Pages:

1. In your `vite.config.ts` file, add your repository name as the base:
   ```js
   export default defineConfig({
     plugins: [react()],
     base: '/backtest-tracker/',
     // other configuration...
   })
   ```

2. Add a GitHub Pages deployment script to your package.json:
   ```json
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
     "preview": "vite preview",
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. Install the gh-pages package:
   ```
   npm install --save-dev gh-pages
   ```

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
