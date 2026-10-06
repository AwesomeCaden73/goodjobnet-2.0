import test from 'node:test';
import assert from 'node:assert/strict';
import { phoneNumbers, matchingJob } from './contactDetails.js';

test('phone choices split common separators, deduplicate numbers and omit missing or invalid numbers', () => {
  const phones = phoneNumbers('(407) 555-0100 / 407-555-0101', '4075550100', 'N/A', '', '407-555-0102 or 407-555-0103');
  assert.deepEqual(phones.map(phone => phone.number), ['4075550100', '4075550101', '4075550102', '4075550103']);
  assert.equal(phoneNumbers('+44 20 7946 0958')[0].number, '+442079460958');
});

test('job preview selects the exact employer, role and location and refuses ambiguous matches', () => {
  const selected = { company: 'Example', role: 'Retail', location: '1 Main St, Orlando, FL' };
  const target = { row_index: 2, company_name: 'Example', available_jobs: 'Retail', company_street: '1 Main St', company_city: 'Orlando', company_state: 'FL' };
  assert.equal(matchingJob([{ ...target, row_index: 1, company_city: 'Tampa' }, target], selected), target);
  assert.equal(matchingJob([target, { ...target, row_index: 3 }], selected), null);
  assert.equal(matchingJob([{ ...target, currently_hiring: 'No' }, { ...target, row_index: 3, currently_hiring: 'Yes' }], { ...selected, hiring: true }).row_index, 3);
});
