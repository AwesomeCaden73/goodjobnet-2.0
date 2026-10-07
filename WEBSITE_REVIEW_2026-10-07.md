# GoodJobNet website review — October 7, 2026

Reviewed the local website at http://localhost:5173 in the existing signed-in administrator session. The original findings below are preserved; the follow-up section records authorized frontend fixes. Backend logic remains unchanged.

## Frontend corrections completed

Following authorization to make corrections while leaving backend logic alone:

- Fixed Job map and My people breadcrumbs/document titles.
- Added frontend validation requiring a ZIP when a location is supplied in either search flow; blank-location browsing remains available. Updated placeholders and ZIP-only empty-state guidance.
- Made job-search connection failures use friendly error text instead of raw JSON parsing errors.
- Added incremental job rendering: 25 cards per hiring group initially, with explicit counts and Show more controls. Browser verified 50 initial cards across both groups, increasing to 75 after expanding the active group; all 1,811 results remain reachable.
- Normalized job verification dates in cards and details; invalid dates display Not available. Suppressed meaningless N/A distances on cards and fixed zero-distance display in seeker-entry matching tables.
- Clarified that new opportunities/people are submitted for review rather than immediately searchable.
- Reset controlled job-type selections after new seeker submission; assigned-person edits retain their saved form values instead of resetting to old defaults.
- Added all 50 states plus DC, ZIP format validation, associated review-field/manual-role labels, unique job-type picker IDs, and accessible success/error announcements.
- Added unsaved-change checks for form Cancel/Return controls, review Previous/Next controls, ordinary internal link clicks, and page reload/close. User confirmed the native discard checks work. Browser Back/Forward and voice-driven edits still need dedicated coverage; this is not a complete draft-recovery system.
- Replaced dead admin placeholder links with disabled loading/unavailable states, added retry on link-load failure, identified spreadsheet destinations, and made file import keyboard accessible. No bulk action was executed.
- Corrected help copy and added links to Jobs and Job map; simplified the employer-industry label and chart expansion wording.

Validation: production build passed; 18 search tests passed; route verification passed, including added regressions for route titles, bounded result rendering, state options, and manual-field labels. Targeted ESLint passed for the changed components/pages outside the legacy HotJobsReview component. The repository-wide lint debt identified in the original audit remains. Browser checks confirmed city-only validation, result expansion, map title, and revised form labels/state choices. No additional records were submitted during correction work.

Deferred: both critical findings, backend name matching, server validation, upstream duplicate/column cleanup, master-sheet promotion, and all other backend changes. Also deferred: full mobile/theme/accessibility verification, result sorting/hiring-only filtering, map loading/failure UI, and draft/history-navigation coverage. The original audit findings are not all marked resolved merely because related frontend improvements were made.

## Scope and test records

Browser coverage: home, jobs, people search, universal search, person/job information panes, creation forms, expiring-job review, assigned people, apps, administration, help, embedded map, job type selection, ZIP-only validation, and theme menu. Implementation review covered routing, authentication, registration, data sources, and form behavior.

Created exactly one job opportunity with company name **TestEntry** and one job seeker named **TestEntry**. Both showed successful submission messages. Both have notes identifying them as website-review tests, not real opportunities/people. Home's pending counts changed from 1 to 2 new jobs and 0 to 1 new seekers. These remain for review. No existing record was edited or deleted. No calls/texts/emails, bulk imports, synchronization, exports, or registration were performed.

The backend was initially stopped. Initial search and job-submission failures were retested after it started; they are not counted as normal-operation failures. The first job submission produced an error and no search match; the subsequent authorized submission succeeded.

## Prioritized findings

### 1. Critical: backend access control is missing

**Evidence:** Source-confirmed in `backend/app.py`. Login returns the literal `dummy_token`; private read, update, delete, import, and administration endpoints have no authentication/authorization decorators or global request guard. `frontend/src/App.jsx` decides signed-in access from a name and role stored in browser localStorage. Administration visibility is filtered in navigation, but its route only checks whether a user exists.

**Impact:** The app itself does not enforce who may read personal seeker information or mutate data. Hiding a page in navigation is insufficient. External infrastructure might impose additional controls, but none were established in this review.

**Improve:** Implement authenticated server sessions and role checks on every protected endpoint; enforce admin permissions on the server and route. Test anonymous, ordinary-user, coach, and administrator permissions. No bypass or unauthorized mutation was attempted.

### 2. Critical: registration grants approved administrator access

**Evidence:** `backend/app.py` registration assigns `role = "admin"` and `Approved = "TRUE"`. The UI says “Apply for access,” suggesting a review process that does not exist in the implementation.

**Improve:** Create least-privileged, pending accounts; require an authorized administrator to approve and assign roles. Validate registration fields server-side. This was confirmed by source inspection, without creating an account.

### 3. High: name search returns unrelated people

**Reproduce:** Search job seekers for `TestEntry`. An unrelated existing person is returned as a “Name match.” Universal search for the same term also includes that person.

**Cause:** `matches_name_loose` in `backend/app.py` accepts a name word contained anywhere in a query word, including a two-letter name fragment contained inside `TestEntry`.

**Improve:** Prefer exact and prefix/token matches; apply length-aware fuzzy matching only to substantial tokens. Label approximate matches and rank them below exact matches. Add regression cases for short name fragments and unrelated queries.

### 4. High: city-only location is silently ignored

**Reproduce:** Jobs → enter `Orlando` in Location → Search. The result is the same unrestricted 1,811 jobs as blank browse, including opportunities outside Orlando, without an error. The placeholder offers “City or address with ZIP code.”

**Improve:** Either resolve city/address locations or require a valid ZIP for distance searches and block unsupported input with an actionable message. Apply consistent behavior to people search. ZIP-only mode correctly rejects a missing ZIP.

### 5. Medium: real pages are labeled “Page not found”

**Reproduce:** Open Job map or My people. Content renders, but the breadcrumb and browser title say “Page not found.”

**Cause:** `frontend/src/components/Shell.jsx` omits `/map` and `/assigned-job-seekers` from its route title lookup.

**Improve:** Add explicit titles and centralize route metadata so navigation, breadcrumbs, and document titles agree.

### 6. Medium: submission success obscures the pending-review workflow

**Evidence:** Both TestEntry submissions succeed and appear in pending home counts. The new job is absent from ordinary company search and universal search. The seeker creation endpoint writes the intake sheet, while search reads a separate master seeker sheet. The success messages simply say “added” or “added to database.”

**Impact:** Users may assume a record is immediately searchable, search unsuccessfully, and submit duplicates. This appears to be a pending/master data workflow, not evidence that the successful write was lost.

**Improve:** Say “Submitted for review,” identify what happens next, and provide a receipt or link to the pending entry. Explain when it becomes searchable and provide duplicate protection.

### 7. Medium: browse-all is a very long unstructured result list

**Evidence:** Blank job search renders 1,811 result cards: 173 currently hiring and 1,638 other opportunities. There are no pagination, sorting, or hiring-only controls in this view.

**Improve:** Default to active hiring results, offer a clear inclusion toggle for other employers, add sorting and pagination or accessible incremental loading, and retain the current filters when moving between results and editing.

### 8. Medium: duplicate job records and inconsistent dates reduce trust

**Evidence:** Browse contains identical employer/role/address entries, including Westgate Resorts and Dollar Tree. Other apparent duplicates use different date formats. Dates mix `10/6/2026` and `2026-10-06` in the same list. Some role fields contain internal follow-up instructions rather than actual roles; one location contains a date where the street address belongs.

**Improve:** Normalize display dates; audit upstream column mapping and deduplicate by employer/location/role while preserving legitimate distinct openings. Separate internal notes from public-facing role information. Investigate duplicates at ingestion, rather than only hiding them in the UI.

### 9. Medium: limited location options and weak form validation

**Evidence:** Opportunity creation/review offers only FL, AL, GA, TX, NY, and CA. Job ZIP fields are plain text without a ZIP pattern; phone fields are unrestricted. A job can be submitted as hiring with no role, website, or hiring contact. A seeker can be submitted with only a name.

**Improve:** Include all supported states or clearly scope the site to supported regions. Validate ZIP/URL/phone formats server-side and client-side. Decide minimum useful information for each workflow and explain optional information. Use warnings when a submission cannot be acted on, rather than indiscriminately making every field required.

### 10. Medium: edit and cancel can silently discard changes

**Evidence:** Entered job-form values were discarded when navigating to another section without a warning. Source shows unconditional navigation for Cancel and review Previous/Next controls; no dirty-form protection was found.

**Improve:** Track unsaved changes and offer save/discard/cancel before leaving populated creation/edit forms. Consider recoverable drafts. No existing job was changed to test this.

### 11. Medium: job-seeker form does not fully reset after success

**Evidence:** Source-confirmed in `JobSeekerEntry.jsx`: successful new-entry submission calls the native form reset but does not clear controlled `selectedJobTypes`. `EntryJobTypes` renders its hidden select from that React state. Opportunity creation remounts its form, but seeker creation does not.

**Impact:** A subsequent entry can inherit the previous person's selected interests. On an assigned-person edit, the same reset branch can return displayed uncontrolled fields to old defaults after saving.

**Improve:** Explicitly reset all controlled state for new entries; keep saved values visible after edits. Add a meaningful regression test with a selected job type. This was established by code inspection; no second test seeker was submitted.

### 12. Medium: some fields and status feedback need accessibility fixes

**Evidence:** The review form's company name, career URL, and contact name appear as unnamed textboxes in the DOM accessibility snapshot. Opportunity entry's manual “Other available jobs” field has no accessible label. Creation success/error containers lack `role="status"` or `role="alert"`.

**Improve:** Associate every input with a visible label and announce submission outcomes. Preserve current good behaviors: skip link, modal close focus, information tabs with arrow-key support, and ZIP-only validation focusing Location.

### 13. Low: error and empty-state messages are inconsistent

**Evidence:** During the stopped-backend case, jobs exposed raw JSON parsing text, people search used a friendly generic message, and forms used “Error connecting to server.” ZIP-only zero results suggest “a larger radius,” even though ZIP-only disables radius. A name-only people search includes an empty outside-radius section even without a distance search.

**Improve:** Standardize errors, include retry actions, and make empty-state suggestions depend on the selected filters. Avoid showing an empty grouping that does not apply.

### 14. Low: admin controls have confusing unavailable/loading states

**Evidence:** Before dashboard statistics resolve, new-job review is a faded link to `#` and new-seeker review is a noninteractive card. After the backend started and statistics loaded, both became valid spreadsheet links. Thus the links are not permanently broken. Spreadsheet review also exits the app without the card explaining that destination. File import uses a hidden file input under a label, without a normal keyboard-focusable button.

**Improve:** Show explicit loading/error/disabled states, provide retry, label spreadsheet destinations, make import keyboard accessible, and explain each bulk action's effect before execution.

### 15. Low: terminology and help copy lag behind the interface

**Evidence:** Help mentions “Screened Job Opportunities” and “Search for nearby jobs,” while navigation uses Jobs, Review, and Job map. Copy includes “Jobs opportunities,” “can be be,” and “find success their journey.” Form text “Desired Company Type for employer” is awkward. Home's desired-job-type chart uses “View all industries,” conflating industry and occupation. Legacy back buttons refer to dashboards while primary navigation calls that page Home.

**Improve:** Adopt one vocabulary throughout the product, update help with clickable routes and practical steps, and simplify field labels. Use consistent capitalization for company names and job types.

## Visual and interaction improvements

- Desktop dark-mode layout is generally coherent: clear hierarchy, consistent purple accent, generous spacing, and useful information panes. No confirmed clipping was observed at the existing desktop size.
- Long role lists make some job cards disproportionately tall. Summarize the first few roles with an expandable remainder; keep full text accessible in details.
- Distinguish jobs/opportunities/employers: a single card currently lists many roles while the total counts cards, which may be mistaken for individual vacancies.
- Show verification age consistently and distinguish an unknown/invalid date from a recently verified opening. Consider default date sorting.
- Suppress `N/A` distance when no origin was supplied; use a meaningful “distance unavailable” message only when a distance search was requested.
- Show map loading feedback and a fallback if the embedded map is blocked. The Google map did load successfully, but initially appeared as a large blank panel. Its relationship to the live job bank is not explained.
- Consider a compact sticky result-filter summary and persistent review actions so long records do not require repeated scrolling.
- Explain that name search bypasses job-type filters more prominently, or disable those inputs while name is populated, so the visible filters match their actual effect.

## Validation and remaining coverage

- Existing search tests: **17 passed**.
- Existing route verification: **passed**; 11 private routes blocked signed out and rendered signed in, and 6 public pages rendered. These checks do not make API authorization secure.
- ESLint: **49 errors, 3 warnings**. Includes unused code, empty catch blocks, hook issues, and irregular whitespace. Treat these as maintenance findings, not 49 independently confirmed user-visible bugs.
- Mobile testing was attempted with a 390×844 viewport override, but the connected Edge tab still reported a roughly 1,912-pixel-wide viewport. The override was reset. **Mobile/tablet layout is not visually verified** and remains a required follow-up, along with light mode, other themes, contrast measurement, and full keyboard/screen-reader testing.
- Live sign-out/registration/login, call/voice integration, bulk administration actions, and destructive controls were not executed. Login/registration and authorization were inspected in source; private/public rendering was covered by route verification.
- TestEntry records remain pending. Existing-record save/delete, new-entry approval, and master-sheet promotion need a dedicated test environment or a test record promoted through the normal review workflow.

## Suggested implementation order

1. Server authentication, role enforcement, and safe registration defaults.
2. Name matching, location validation, and a clear pending-submission lifecycle.
3. Route titles, form reset/validation, accessible labels, and unsaved-change protection.
4. Result pagination/sorting, duplicate cleanup, date normalization, and admin feedback.
5. Copy polish and verified mobile/light-mode/accessibility coverage.
