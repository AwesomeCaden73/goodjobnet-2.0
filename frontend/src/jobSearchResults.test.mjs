import test from 'node:test';
import assert from 'node:assert/strict';
import { checkedJobResults } from './jobSearchResults.js';
import { verificationDate } from './components/searchFormatting.js';

test('a job bank response containing only blank/default rows is reported as a data failure', () => {
  assert.throws(() => checkedJobResults({ recent: [{ company: 'Unknown', role: 'Various', location: 'FL' }, {}], older: [] }), /without job details/);
  assert.throws(() => checkedJobResults(undefined), /incomplete response/);
});

test('valid jobs survive alongside blank rows and genuine empty searches remain empty', () => {
  const job = { company: 'Example', role: 'Retail', location: 'Orlando, FL' };
  assert.deepEqual(checkedJobResults({ recent: [{}, job], older: [] }), { recent: [job], older: [] });
  assert.deepEqual(checkedJobResults({ recent: [], older: [] }), { recent: [], older: [] });
});

test('verification dates normalize both source formats and reject invalid calendar dates', () => {
  assert.equal(verificationDate('2026-10-06'), 'Oct 6, 2026');
  assert.equal(verificationDate('10/6/2026'), 'Oct 6, 2026');
  assert.equal(verificationDate('2024-02-29'), 'Feb 29, 2024');
  for (const value of ['', null, 'N/A', '2026-02-29', '13/1/2026', '2026-04-31']) {
    assert.equal(verificationDate(value), 'Not available');
  }
});
