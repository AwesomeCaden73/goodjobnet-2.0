// Server-render the route tree with isolated in-memory storage. No browser or API writes.
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';
import { signInDestination } from './src/signInDestination.js';

assert.equal(signInDestination('/job-seeker-search'), '/job-seeker-search');
assert.equal(signInDestination('/hot-jobs-review?category=5days'), '/hot-jobs-review?category=5days');
for (const from of [undefined, '//outside.example', 'https://outside.example', '/login']) {
  assert.equal(signInDestination(from), '/employment-dashboard');
}

const values = new Map();
globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.window = { location: new URL('http://localhost/'), history: { state: { idx: 0 }, replaceState() {} }, addEventListener() {}, removeEventListener() {} };
globalThis.document = { defaultView: window };
globalThis.fetch = () => { throw new Error('Route rendering must not perform API operations'); };
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const render = path => { window.location = new URL(path, 'http://localhost'); return renderToString(React.createElement(App)); };
  const privatePages = {
    '/employment-dashboard': 'Your community at a glance',
    '/dashboard': 'Your community at a glance',
    '/job-entry': 'Job opportunity',
    '/job-seeker-entry': 'Job seeker',
    '/job-seeker-search': 'Job Seeker Search',
    '/assigned-job-seekers': 'Assigned Job Seekers List',
    '/hot-jobs-review': 'Review jobs',
    '/hot-jobs-5review': 'Review jobs',
    '/hot-jobs-46review': 'Review jobs',
    '/admin-page': 'System Administration',
    '/create': 'What would you like to add?',
  };
  for (const [path, title] of Object.entries(privatePages)) {
    const html = render(path);
    assert(!html.includes(title), 'Private content rendered while signed out: ' + path);
    assert(!html.includes('href="/job-seeker-search"'), 'Private navigation leaked: ' + path);
  }
  for (const [path, title] of Object.entries({ '/': 'Your next chapter starts here.', '/hot-job-search': 'Job Search', '/help': 'Information &amp; Help', '/map': 'Opportunities near you', '/apps': 'Everything you need', '/login': 'Sign in' })) {
    assert(render(path).includes(title), 'Public page failed to render: ' + path);
  }
  values.set('goodjobnet_user', JSON.stringify({ name: 'Test Reviewer', role: 'admin' }));
  for (const [path, title] of Object.entries(privatePages)) assert(render(path).includes(title), 'Signed-in page failed to render: ' + path);
  for (const path of ['/create', '/job-entry', '/job-seeker-entry', '/hot-jobs-review']) assert(!render(path).includes('class="section-navigation"'), 'Unexpected section tabs: ' + path);
  assert(!render('/hot-job-search').includes('href="/job-entry"'), 'Jobs still includes an entry tab');
  assert(!render('/job-seeker-search').includes('href="/job-seeker-entry"'), 'People still includes an entry tab');
  const { default: EntryJobTypes } = await server.ssrLoadModule('/src/components/EntryJobTypes.jsx');
  const picker = renderToString(React.createElement(EntryJobTypes, { name: 'available_jobs_select', initial: ['Retail'] }));
  assert(picker.includes('name="available_jobs_select"') && picker.includes('value="Retail" selected=""'), 'Entry picker lost the native submission field');
  assert(!picker.includes('name="job_type"'), 'Entry picker added an API field');
  assert(render('/search').includes('People'), 'Signed-in universal search is missing people');
  assert(!render('/apps').includes('Page not found'), 'App catalog has an incorrect breadcrumb');
  for (const path of ['/map', '/assigned-job-seekers']) assert(!render(path).includes('Page not found'), 'Valid page has an incorrect breadcrumb: ' + path);
  const { JobGroups } = await server.ssrLoadModule('/src/components/SearchCards.jsx');
  const manyJobs = Array.from({ length: 60 }, (_, index) => ({ company: `Example ${index}`, role: 'Retail', date_verified: '2026-10-06' }));
  const jobGroups = renderToString(React.createElement(JobGroups, { results: { recent: manyJobs, older: [] }, onSelect() {} }));
  assert.equal((jobGroups.match(/aria-label="View job:/g) || []).length, 25, 'Large result sets must render a bounded initial list');
  assert(jobGroups.replace(/<!--.*?-->/g, '').includes('Show more currently hiring opportunities'), 'Remaining results must stay reachable');
  const entry = render('/job-entry');
  assert(entry.includes('value="WA"') && entry.includes('value="DC"'), 'State choices are incomplete');
  assert(entry.includes('for="manual-jobs"'), 'Manual job types have no accessible label');
  assert(render('/search?q=Retail').includes('value="Retail"'), 'Header search lost the URL query');
  assert(render('/job-entry').includes('for="jobentry-company_name"'), 'Entry labels are not associated with controls');
  values.set('goodjobnet_user', '{broken-json');
  assert(!render('/job-entry').includes('Job opportunity'), 'Malformed user state bypassed access guard');
  values.clear();
  assert(!render('/search').includes('href="/job-seeker-search"'), 'Signed-out search leaked private navigation');
  console.log('PASS: 11 private routes blocked signed out and rendered signed in; 6 public pages rendered; malformed state and public search verified. No API calls.');
} finally { await server.close(); }
