import express from 'express';
import enricherRoute from './routes/enricher.route.js';
import { config } from './config/env.js';

const app = express();

app.use(express.json());
app.use(enricherRoute);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = config.port || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;