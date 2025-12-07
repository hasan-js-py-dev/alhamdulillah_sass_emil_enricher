import path from 'path';
import { getTempRootDir, listJobDirectories, readMetadata } from '../utils/storage.js';

export async function listJobs(req, res) {
  const rawLimit = Number(req.query.limit) || 50;
  const limit = Math.max(1, Math.min(rawLimit, 200));
  try {
    const jobDirs = await listJobDirectories();
    const metadataEntries = await Promise.all(jobDirs.map((dir) => readMetadata(dir)));
    const jobs = metadataEntries
      .filter(Boolean)
      .map((meta) => ({
        jobId: meta.jobId,
        userId: meta.userId,
        originalFilename: meta.originalFilename,
        status: meta.status || 'processing',
        createdAt: meta.createdAt,
        completedAt: meta.completedAt || null,
        totals: meta.totals || null,
        progress: meta.progress || null,
        downloadUrl: meta.downloadUrl || null,
        resultCount: typeof meta.resultCount === 'number'
          ? meta.resultCount
          : meta.progress?.processedContacts || 0,
      }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, limit);
    return res.json({ jobs });
  } catch (error) {
    console.error('Job list error:', error);
    return res.status(500).json({ error: 'Unable to load jobs' });
  }
}

export async function getJobStatus(req, res) {
  const { jobId } = req.params;
  if (!jobId) {
    return res.status(400).json({ error: 'jobId is required' });
  }
  try {
    const root = await getTempRootDir();
    const jobDir = path.join(root, jobId);
    const metadata = await readMetadata(jobDir);
    if (!metadata) {
      return res.status(404).json({ error: 'Job not found' });
    }
    return res.json(metadata);
  } catch (error) {
    console.error('Job status error:', error);
    return res.status(500).json({ error: 'Unable to fetch job status' });
  }
}
