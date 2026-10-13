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


import { fullAddress, addressFields } from './reviewAddress.js';
test('single-line addresses preserve unchanged data and validate changed addresses', () => {
  const job = { company_street: '1 Main St, Suite 2', company_city: 'Orlando', company_state: 'FL', company_zip: '32801' };
  assert.deepEqual(addressFields(fullAddress(job), job), {});
  assert.deepEqual(addressFields('2 Main St, Suite 3, Tampa, fl 33602', job), { company_street: '2 Main St, Suite 3', company_city: 'Tampa', company_state: 'FL', company_zip: '33602' });
  assert.throws(() => addressFields('An ambiguous address', job), /Street, City, ST ZIP/);
});


import { cancelSpeech } from './speechCancellation.js';
test('canceling speech invalidates callbacks before synchronous browser cancellation', () => {
  let restarted = false;
  const utterance = { onend: () => { restarted = true; }, onerror: () => { restarted = true; } };
  const utteranceRef = { current: utterance };
  const speakingRef = { current: true };
  cancelSpeech({ cancel() {
    assert.equal(utteranceRef.current, null);
    assert.equal(speakingRef.current, false);
    utterance.onend?.();
    utterance.onerror?.();
  } }, utteranceRef, speakingRef);
  assert.equal(restarted, false);
  cancelSpeech(undefined, utteranceRef, speakingRef);
});
