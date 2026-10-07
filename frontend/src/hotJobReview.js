// Spreadsheet deletion shifts later rows even when a review queue is filtered or sorted.
export function remainingReviewJobs(jobs, deletedRow) {
  return jobs.filter(job => Number(job.row_index) !== Number(deletedRow)).map(job => (
    Number(job.row_index) > Number(deletedRow)
      ? { ...job, row_index: Number(job.row_index) - 1 }
      : job
  ));
}
