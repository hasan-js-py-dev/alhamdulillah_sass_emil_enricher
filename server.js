import 'dotenv/config';
import express from 'express';
import path from 'path';
import enricherRoute from './routes/enricher.route.js';
import { config } from './config/env.js';
import { startCleanupScheduler } from './schedulers/cleanupScheduler.js';
import { getTempRootDir } from './utils/storage.js';

const app = express();
const publicDir = path.join(process.cwd(), 'public');

app.use(express.json());
app.use('/email-enricher', express.static(publicDir));
app.get('/', (req, res) => res.redirect('/email-enricher'));
app.use(enricherRoute);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = config.port || 3000;

app.listen(port, async () => {
  await getTempRootDir();
  startCleanupScheduler(console);
  console.log(`Server is running on port ${port}`);
});

export default app;