# PoE Tools Production Release and Cutover Plan

**Goal:** Publish the merged PoE Tools application on the canonical public `Simonerrror/exile-leveling` GitHub Pages URL, prove the built site, then retire `poe-regex-ru` safely.

## Task 1: Bundle and PWA isolation

- Add a build-manifest test that no regex JSON/chunk is reachable from the static entry graph.
- Exclude regex JSON and route chunks from eager Workbox precache; allow runtime browser caching after navigation.
- Enforce initial static JS ≤184,180 bytes gzip, production sourcemaps absent, each non-item shard ≤500KB, each item shard ≤10MB, total regex JSON ≤20MB.
- Print per-route/per-shard sizes in `check:bundle`.

## Task 2: Deterministic clean-room verification

- In a disposable worktree/clone run `npm ci --ignore-scripts` and `npm run verify` using the committed lockfile only.
- Run the legacy exporter twice and require the second manifest hash and git diff to be unchanged.
- Audit forbidden legacy modules, CRA imports, source maps, unsafe external URLs, and removed vendor fields.

## Task 3: GitHub Pages deployment

- Verify the existing Pages workflow uses pinned actions, deterministic install, production build, and the `/exile-leveling/` base.
- Merge or fast-forward the reviewed branch into the publishing branch and push the canonical repository.
- Wait for the GitHub Pages workflow and deployment to finish successfully; do not infer success from push alone.

## Task 4: Published production smoke

- Open `https://simonerrror.github.io/exile-leveling/#/` with cache bypass.
- Verify homepage, leveling, build, regex catalog, all twelve regex routes, RU/EN, reload/deep link, profile migration, copy A/B, mobile 390px, desktop, console/network errors, service-worker update, and absence of sourcemaps.
- Confirm regex JSON is not requested on homepage and only the selected tool/locale shard is requested on its route.

## Task 5: Legacy cutover

- Only after production smoke passes, update `poe-regex-ru` README/site to point to PoE Tools and explain the merge.
- Preserve source history and tags; do not delete generated data or rewrite history.
- Archive the old GitHub repository only if archive permission is available and the redirect is already visible.
- Re-run the canonical URL smoke after the redirect/archive change.

## Task 6: Final evidence

- Report commit/deployment URL, workflow result, test counts, initial gzip, JSON total, manifest hash, route smoke matrix, and legacy archive/redirect state.
- Mark the persistent goal complete only when no release or cutover action remains.
