import test from 'node:test';
import assert from 'node:assert/strict';
import { checkedJobResults } from './jobSearchResults.js';

test('a job bank response containing only blank/default rows is reported as a data failure', () => {
  assert.throws(() => checkedJobResults({ recent: [{ company: 'Unknown', role: 'Various', location: 'FL' }, {}], older: [] }), /without job details/);
  assert.throws(() => checkedJobResults(undefined), /incomplete response/);
});

test('valid jobs survive alongside blank rows and genuine empty searches remain empty', () => {
  const job = { company: 'Example', role: 'Retail', location: 'Orlando, FL' };
  assert.deepEqual(checkedJobResults({ recent: [{}, job], older: [] }), { recent: [job], older: [] });
  assert.deepEqual(checkedJobResults({ recent: [], older: [] }), { recent: [], older: [] });
});
