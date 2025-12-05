import fs from 'fs/promises';
import path from 'path';
import { listJobDirectories, readMetadata, removeDirectory } from '../utils/storage.js';
import { getActiveJobIds } from '../services/jobState.service.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
const JOB_TTL_MS = 24 * 60 * 60 * 1000;

let intervalRef = null;

export function startCleanupScheduler(logger = console) {
  if (intervalRef) {
    return;
  }
  intervalRef = setInterval(() => {
    cleanupExpiredJobs(logger).catch((error) => logger.error?.('cleanupScheduler error', error));
  }, ONE_HOUR_MS);
  cleanupExpiredJobs(logger).catch((error) => logger.error?.('cleanupScheduler error', error));
}

export function stopCleanupScheduler() {
  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
  }
}

async function cleanupExpiredJobs(logger) {
  const activeJobs = getActiveJobIds();
  const jobDirs = await listJobDirectories();
  const now = Date.now();

  for (const jobDir of jobDirs) {
    try {
      const metadata = await readMetadata(jobDir);
      const jobId = metadata?.jobId || path.basename(jobDir);
      if (activeJobs.has(jobId)) {
        continue;
      }
      const createdAtTs = metadata?.createdAt ? Date.parse(metadata.createdAt) : await getDirectoryBirthTime(jobDir);
      if (!createdAtTs) {
        continue;
      }
      if (now - createdAtTs >= JOB_TTL_MS) {
        await removeDirectory(jobDir);
        logger.info?.(`CleanupScheduler: removed expired job ${jobId}`);
      }
    } catch (error) {
      logger.warn?.(`CleanupScheduler: failed to clean ${jobDir}: ${error.message}`);
    }
  }
}

async function getDirectoryBirthTime(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.birthtimeMs;
  } catch (error) {
    return null;
  }
}
