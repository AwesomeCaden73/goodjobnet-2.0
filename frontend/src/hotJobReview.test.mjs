import assert from 'node:assert/strict';
import test from 'node:test';
import { remainingReviewJobs } from './hotJobReview.js';

test('deletion preserves subsequent job identities in a sorted, filtered queue', () => {
  const jobs = [{ row_index: 9, company_name: 'Later' }, { row_index: 3, company_name: 'Delete' }, { row_index: 2, company_name: 'Earlier' }];
  const remaining = remainingReviewJobs(jobs, 3);
  assert.deepEqual(remaining.map(job => job.row_index), [8, 2]);
  assert.equal(remaining[0].company_name, 'Later');
  assert.equal(jobs[0].row_index, 9);
  assert.deepEqual(remainingReviewJobs(remaining, 8).map(job => job.row_index), [2]);
});
