import test from 'node:test';
import assert from 'node:assert/strict';
import { hotJobFilters } from './hotJobFilters.js';

function form(values) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  return data;
}
test('company-only search preserves the existing unrestricted company request', () => {
  assert.deepEqual(hotJobFilters(form({ company_name: ' Disney ', radius: '20' })), { search_type: 'company', company_name: 'Disney' });
});
test('combined company, roles, and radius use fields already accepted by the location endpoint', () => {
  assert.deepEqual(hotJobFilters(form({ company_name: 'Disney', job_type: ['Retail', 'Sales'], other_job_type: ' Guest services ', address: 'Orlando 32801', radius: '35' })), {
    search_type: 'type-location', company_name: 'Disney', job_types: ['Retail', 'Sales', 'Guest services'], address: 'Orlando 32801', radius: '35',
  });
});
test('location and role searches retain their original request shape without a company', () => {
  assert.deepEqual(hotJobFilters(form({ job_type: ['Retail'], address: '32801', radius: '10' })), { search_type: 'type-location', job_types: ['Retail'], address: '32801', radius: '10' });
});
test('blank filters browse the existing job search scope', () => {
  assert.deepEqual(hotJobFilters(form({ company_name: ' ', other_job_type: ' ' })), { search_type: 'type-location', job_types: [], address: '', radius: '20' });
});

test('ZIP-only keeps company and job filters and sends the backend exact-ZIP contract', () => {
  const data = hotJobFilters(form({ company_name: 'Example', job_type: ['Retail'], address: '12345 Main St, City 01234-5678' }), { zipOnly: true });
  assert.equal(data.search_type, 'type-location');
  assert.equal(data.company_name, 'Example');
  assert.deepEqual(data.job_types, ['Retail']);
  assert.equal(data.location_mode, 'zipcode');
  assert.equal(data.zipcode, '01234');
});
