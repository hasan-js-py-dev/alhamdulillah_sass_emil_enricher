import express from 'express';
import { startEnricher } from '../controllers/enricher.controller.js';

const router = express.Router();

// Define POST route for starting the enricher.
router.post('/v1/scraper/enricher/start', startEnricher);

export default router;