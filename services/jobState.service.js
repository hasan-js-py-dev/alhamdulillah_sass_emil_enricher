const activeJobs = new Set();

export function markJobActive(jobId) {
  if (jobId) {
    activeJobs.add(jobId);
  }
}

export function markJobComplete(jobId) {
  if (jobId) {
    activeJobs.delete(jobId);
  }
}

export function getActiveJobIds() {
  return new Set(activeJobs);
}
