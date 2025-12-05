import express from 'express';
import { startEnricher, uploadContactsFile, downloadJobResult } from '../controllers/enricher.controller.js';
import { getJobStatus, listJobs } from '../controllers/job.controller.js';
import { prepareJobContext, uploadSingleFile } from '../middlewares/jobUpload.middleware.js';

const router = express.Router();

// Define POST route for starting the enricher.
router.post('/v1/scraper/enricher/start', startEnricher);
router.post('/v1/scraper/enricher/upload', prepareJobContext, uploadSingleFile, uploadContactsFile);
router.get('/v1/scraper/enricher/download/:jobId', downloadJobResult);
router.get('/v1/scraper/enricher/jobs', listJobs);
router.get('/v1/scraper/enricher/jobs/:jobId', getJobStatus);

export default router;