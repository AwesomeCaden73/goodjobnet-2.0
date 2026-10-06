import test from 'node:test';
import assert from 'node:assert/strict';
import { enteredZip, zipOnlySeekers, zipOnlyJobs } from './zipSearch.js';

test('ZIP extraction accepts full addresses, ZIP+4 and leading zeroes without mistaking a street number for the ZIP', () => {
  assert.equal(enteredZip('12345 Main Street, Orlando 32801-1234'), '32801');
  assert.equal(enteredZip('01234'), '01234');
  assert.equal(enteredZip('Orlando'), '');
  assert.equal(enteredZip('123456'), '');
});
test('seeker filtering checks ZIP fields across both groups, including name-search results outside the radius', () => {
  const same = { zipcode: '32801.0', distance: 0 };
  const different = { zipcode: '32802', distance: 0 };
  const missing = { distance: 0 };
  assert.deepEqual(zipOnlySeekers({ nearby: [same, different], other: [same, missing] }, '32801'), { nearby: [same], other: [same] });
});
test('job ZIP verification excludes zero-distance results in another ZIP and preserves both hiring groups', async () => {
  const job = { company: 'Example Company', role: 'Retail', location: '1 Main, Orlando, FL', distance: '0.0 miles' };
  const other = { ...job, location: '2 Main, Orlando, FL' };
  let calls = 0;
  const result = await zipOnlyJobs({ recent: [job, other], older: [job] }, '32801', undefined, async (url) => {
    calls++;
    assert.equal(url, '/api/hot-jobs-review?category=company&company=Example%20Company');
    return { ok: true, json: async () => ({ success: true, jobs: [
      { company_name: 'Example Company', available_jobs: 'Retail', company_street: '1 Main', company_city: 'Orlando', company_state: 'FL', company_zip: '32801' },
      { company_name: 'Example Company', available_jobs: 'Retail', company_street: '2 Main', company_city: 'Orlando', company_state: 'FL', company_zip: '32802' },
    ] }) };
  });
  assert.deepEqual(result, { recent: [job], older: [job] });
  assert.equal(calls, 1, 'Repeated companies should only be looked up once');
});
test('failed ZIP verification fails the search instead of showing unverified matches', async () => {
  await assert.rejects(zipOnlyJobs({ recent: [{ company: 'Example' }] }, '32801', undefined, async () => ({ ok: false, json: async () => ({ success: false }) })), /could not be verified/);
});
