// Configuration and environment variables
export const config = {
  // Base URL for the MailTester Ninja API
  mailTesterBaseUrl: process.env.MAILTESTER_BASE_URL || 'https://happy.mailtester.ninja/ninja',
  // URL for retrieving a MailTester subscription key
  keyProviderUrl: process.env.KEY_PROVIDER_URL || 'https://api.daddy-leads.com/mailtester/key/available',
  // Minimum delay between outbound API calls (ms) to respect rate limits
  minDelayMs: Number(process.env.MIN_DELAY_MS) || 900,
  // Number of contacts processed per batch wave during combo processing
  comboBatchSize: Number(process.env.COMBO_BATCH_SIZE) || 25,
  // Port for the HTTP server
  port: Number(process.env.PORT) || 3000,
};