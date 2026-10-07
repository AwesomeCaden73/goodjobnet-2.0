# Upstream integration — October 7, 2026

Prepared on `integrate-upstream-2026-10-07` and committed to the fork's local `master` branch at the user's request.

Compared the fork at `e638c19` with [upstream master at 1b1ef07](https://github.com/mgoodell6/goodjobnet/commit/1b1ef07ad45b5fcd5652cc5f2c5ae14f9affec6e), including all six feature changes introduced October 6. Shared ancestor: `89bc65a`. This is a selective integration into the redesigned frontend, with the feature conflicts resolved according to the user's decisions. No upstream push remote was configured and nothing was pushed. The earlier abandoned attempt remains in its existing stash.

## Resolved feature conflicts

| Upstream change | Fork behavior | User decision and result |
| --- | --- | --- |
| Remove seeker entry/edit forms, links, and API routes | Create and profile editing are integrated into the workspace | Keep creation and editing. Existing forms, protected routes, API endpoints, assigned-seeker links, and information-pane editing are preserved. |
| Separate distance/ZIP search controls | Combined company/type/location filters with a ZIP-only toggle | Keep the fork's controls and use upstream's backend ZIP filter. Exact ZIP searches now send `location_mode: "zipcode"` and `zipcode`, preserve company/type filters and hiring groups, and avoid additional company-detail lookups. |
| Restore a dashboard link to the external map editor | Dedicated embedded map page with navigation and an external viewer link | Keep the existing map page and navigation; no duplicate editor shortcut. |

## Integrated additions

- **Job deletion (`dc81f2a`):** added a theme-compatible Delete job action to the existing review form, the voice command, and the backend endpoint. Both paths require the existing upstream confirmation. Save/delete requests are serialized. The backend rejects invalid indices and the header row. Remaining queue row numbers shift after deletion, and form inputs remount so the next job cannot inherit deleted-job values. Existing return navigation is preserved.
- **Drive CSV import (`285d8f0`):** the existing admin operation now reads the SharePoint export from the upstream Drive file/folder instead of a server-local CSV. The scratch script uses the same loader. Folder lookup handles pagination, prefers `JobSeekerList.csv`, and rejects ambiguous fallback files. Invalid or empty exports are rejected before clearing the destination. The destination columns and complex-field translation remain compatible. The checked-in local CSV is retained as an unused historical artifact; runtime import no longer reads it.
- **Spreadsheet alignment (`662b4c5`):** new job submissions and registrations explicitly start at column A. Job exports restore manual rows at A2 and append fetched rows from column A after those records.
- **Related cache fix:** successful job updates invalidate cached job records even when no submitter column is updated.

## Validation

- `cd frontend; npm run build` — passes.
- `cd frontend; npm run test:search` — 17 tests pass. Coverage includes combined ZIP filters and deletion from a sorted, filtered queue. The former client-side ZIP verification tests were replaced by the request-contract and backend tests.
- `cd frontend; npm run test:routes` — passes: 11 protected routes and six public pages, including seeker creation and editing routes.
- `backend/.venv/Scripts/python.exe -m unittest discover -s backend -p test_upstream_integration.py -v` — 14 tests pass with mocked Google and job-search services. Covers source loading, CSV validation and translation, manual export-row preservation, column alignment, ZIP filters, retained seeker writes, deletion, and cache invalidation.
- `git diff --check` — passes.
- ESLint still fails on existing unused bindings, empty cleanup catches, and React effect patterns. The review component has the same rule counts as committed HEAD: 24 unused-binding findings, 12 empty catches, three state-in-effect errors, and three effect-dependency warnings. The voice effect's existing dependency warning now also names the delete handler. These rules were not suppressed and unrelated cleanup was left out of this integration.

No live Google Sheets/Drive writes, CSV sync, microphone, or telephone calls were performed. Live Drive permissions and voice operation still need an application smoke test. Spreadsheet identity remains row-based, as upstream designed it; edits from another session can still invalidate an already-loaded queue.
