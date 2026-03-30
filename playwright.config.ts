import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'npm run backend:dev',
      port: 3001,
      reuseExistingServer: true,
    },
    {
      command: 'npm run frontend:dev',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
