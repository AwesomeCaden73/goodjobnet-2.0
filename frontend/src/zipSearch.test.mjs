import test from 'node:test';
import assert from 'node:assert/strict';
import { enteredZip, zipOnlySeekers } from './zipSearch.js';

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
