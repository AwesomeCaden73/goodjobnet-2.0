# Frontend workspace redesign

GoodJobNet now uses a Microsoft 365 inspired shell: a persistent app rail, app launcher, universal search, contextual navigation, a community dashboard, and consistent forms and tables. The sign-in page uses a two-step Microsoft inspired layout with GoodJobNet branding. Account registration remains available with the original fields.

## Navigation

- Public: home, job search, job map, help, public apps, and sign-in.
- Signed in: dashboard, people search, assigned people, job review, entry forms, creation hub, and administration.
- Universal search: enter a query in the header or focus it with Ctrl/Cmd+K. Results combine jobs, people (signed in only), and accessible apps. Advanced search retains the original location, radius, company, and job-type filters.
- Jobs and people open a shared information pane from universal search and the dedicated search pages. The pane supports keyboard navigation, Escape dismissal, and focus restoration. Its Edit action opens the existing seeker form and returns to the original universal query or saved dedicated search.
- Both dedicated search pages use the universal-search result cards while preserving their original filters and matching-job behavior.
- The palette button beside the account menu offers Purple (default), Dark cyan, Orange, and Green, with an independent dark-mode switch. Preferences are stored locally as `goodjobnet_theme` and apply to the shell, search, operational forms, and sign-in page.
- Existing route URLs and review queue aliases remain supported.

## Compatibility

No backend files were changed. Existing operational request bodies, form field names, endpoint URLs, and response formats are preserved. The new search combines existing read-only search operations without adding an endpoint. It uses the existing job-search scope (including its verification-date rules), filters jobs locally by company/role/location/notes, and combines name and desired-job-type searches for people.

Frontend route guards use the application's existing stored login identity; this change does not introduce server-side authentication or alter the backend's authorization behavior. Signing out clears the identity and cached people-search data. Cross-tab sign-out is synchronized.

## Verification

Run from this directory:

```text
npm run build
npm run test:search
npm run test:routes
```

- Production build passes.
- Five isolated search tests check exact payloads, public/private source selection, deduplication, partial failures, cancellation, and empty matches.
- Server-rendering checks cover 11 private routes while signed out and signed in, six public pages, and malformed stored identity. These checks use in-memory fixtures and make no API calls.
- Live local sign-in and search succeeded; a Retail query returned both jobs and people. No records were created, submitted, imported, exported, or edited during testing. Login invokes the backend's existing last-login timestamp update.
- Existing entry, search, review, assignment, and admin field names and fetch operations were compared to the original source and remain unchanged.
- New workspace, navigation, search, login, and help files pass targeted lint. Full-project lint has pre-existing findings in the older operational components.
- Follow-up browser review completed in connected Edge: desktop layouts, 768px tablet layouts, and 390px/320px phone layouts. Checked home, both search pages, universal results, person details, assigned people, creation hub, both entry forms, review queues and existing review details, administration, app catalog/launcher, help, map, sign-in, and registration layout.
- Corrected corrupted punctuation, cramped mobile result cards and metric cards, review and administration overflow, distracting mobile artwork, navigation/detail labels, source-specific pagination, and field-label associations. Tables scroll inside their containers. The 320px route audit and 768px header/layout audit report no page overflow after fixes.
- Browser checks confirmed public routes and hidden private navigation, protected-route redirection, successful sign-in back to the originally requested page, live company and universal searches, person-detail return navigation, Ctrl/Cmd+K search, Escape menu dismissal, and embedded map loading. Viewport overrides were reset after testing.
- Create/save, calling, import, and export actions were deliberately not exercised against live data. Sign-in performs only the existing backend last-login timestamp update.
- Search-pane/theme follow-up: verified live job-type and company searches, universal jobs and people, both Edit/return paths, restored seeker filters/results, automatic matching jobs, pane tabs/Escape/focus restoration, all eight palette/mode combinations, reload persistence, and dark sign-in/private-route redirect. Checked desktop, 820px tablet, and 390px/320px phone geometry; no page or pane overflow. No records were added or edited.
