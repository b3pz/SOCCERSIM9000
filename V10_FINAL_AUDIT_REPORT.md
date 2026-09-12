# SERIEA 9000 SIM — V10 FINAL audit

## Issues found and fixes performed

- Follow-up Coppe dashboard regression: the V63 background-specific selector still forced the content box to left 16%, top 18%, width 68%, height 67%, overriding the newer centered dashboard while retaining its translateX transform. Removed this obsolete geometry rule for Coppe and Calendar; both now use the normal dashboard content box. View switching also explicitly clears inactive background classes. Added regression checks for geometry-changing background selectors and repeated view transitions.

- Follow-up visual alignment: Career and all Cup/national selectors now share a three-column layout with description on the left, team name/year above the central crest, HOME/AWAY kits below it, and OVR/formations on the right. Cup format and quick team selection remain available in expandable side-panel sections.
- Follow-up hiring screen: removed inherited oval geometry and fixed height, normalized the name form and button, and retained contained scrolling for short viewports. Wizard back navigation continues to respect hidden steps.

- JSON save dates became strings and could break calendar rendering. Career loading now hydrates dates and supplies missing V10 state defaults.
- Career cup matches temporarily replaced league state, could register league results, and could autosave that temporary state. Match finalization now separates league/cup ownership, restores the career context, and blocks temporary/standalone career writes.
- Standalone saves omitted player condition and discipline. They now retain team states and player statistics while preserving the separate career object.
- Loaded knockout ties and bracket history became separate objects. Hydration reconnects them so played results update the displayed bracket after loading.
- Repeated match starts/results were not guarded. Launch, league registration, tournament submission, event processing, and condition finalization now have duplicate guards.
- Played knockout draws were resolved only after leaving post-match. Direct penalties or Golden Goal/penalties now resolve before post-match; the tournament consumes that same decision. CPU Golden Goals now appear in scorelines too.
- Knockout winners were reshuffled after each round. Progression now preserves the bracket order and original Final Eight quarter-final seeds.
- Career cups had generic calendar labels and could be played without calendar restrictions. User cup fixtures now occupy distinct Wednesday slots, appear in the next-match flow, and must be completed before later league rounds/Final Eight. Completed cup honours are retained.
- Substituted players could return, unavailable substitutes could enter, and tracking occurred before validation. User/CPU substitutions now validate availability, limit, and prior participation; only accepted changes affect minutes and set-piece takers.
- Dismissed/substituted players could remain scheduled for later played events. Later events now use eligible on-field players; red cards remove the player and end their playing minutes. Silent dismissals also stop their playing-time calculation.
- Condition counters lacked bounds; season changes recreated every team state. Counters now normalize defensively; season transitions retain team configuration and outstanding suspensions, with summer fitness/injury recovery.
- Player appearance statistics counted goals rather than appearances. Condition finalization now counts each participating player once.
- Tactical-XI ordering omitted FW players and could repeat another player. The intended XI now includes FW players without duplicates. Existing pitch-tab visibility and tactical-container hotfixes remain intact.
- Compact statistics checked nonexistent window properties for lexical career/current variables. They now read the correct state.
- Returning to the menu could leave a temporary cup context active. Navigation now finalizes/cancels that context and restores the career; stale prematch-edit mode is cleared.
- Autosave watched only league round changes, missing formation/set-piece changes and failing to retry errors. It now watches relevant state changes, avoids overlapping writes, and retries failed saves. Save writes take immutable snapshots and reuse the IndexedDB connection.
- Save imports lacked defensive handling; manager/save metadata could be inserted as HTML. Invalid imports/load failures now surface usable errors, colliding imported IDs remain separate, and displayed user metadata is escaped.
- Kit transparency processing could reprocess its own generated data URL. Generated data URLs are now excluded from repeat processing.
- The latest narrow-screen document-flow CSS conflicted with the short-landscape viewport/artboard rules. That block now applies to portrait/taller viewports, preserving the established short-landscape layout.
- Root script/style cache tokens were inconsistent. They now share `10-final-3` without changing load order or adding dependencies.

## Files changed

The exact upload list is `V10_FINAL_CHANGED_FILES.txt`:

- `index.html`
- `css/v104-professional-layout.css`
- `css/v63-precision-artboard.css`
- `js/save-manager.js`
- `js/save-integration.js`
- `js/v7-release.js`
- `js/v72-publication-ui.js`
- `js/v91-final-touches.js`
- `js/v10-release.js`
- `js/v104-navigation.js`
- `tools/validate-v10.js`
- `V10_FINAL_AUDIT_REPORT.md`
- `V10_FINAL_CHANGED_FILES.txt`

## Tests performed and passed

- `tools/validate-v10.js`: **5,283 checks passed**, using the existing bundled Node 24 runtime. It can be run independently with `node tools/validate-v10.js`.
- Syntax parsing of repository JavaScript and root inline scripts; separate syntax check for the existing ESM Vite configuration.
- Shared Career/Cup picker structure and Career HOME/AWAY/OVR rendering checks passed. Root HTML structure, duplicate static IDs, duplicate script/style loads, literal asset paths, exact filename case, and large embedded raster checks passed. HTML files also parsed with Python's standard HTML parser.
- **32 Italian clubs, 32 foreign clubs, 61 national editions, 2,164 roster players** validated for IDs, names, goalkeeper presence, formation totals, and rating/attribute bounds.
- All **375** team crest/home/away PNG paths exist with exact filename case, including **183** national PNGs. National IDs match their edition years.
- Both 16-team league groups: 30 rounds each, 480 distinct directed fixtures overall, full-season standings arithmetic, and duplicate-registration protection passed.
- **100 complete simulated tournaments** across Coppa Italia, Coppa dei Campioni, Coppa UEFA, World Cup and European Championship passed participant-count and progression checks. National draws reject repeated countries.
- Played progression with JSON reload between every match/leg passed for all five cup formats.
- Final Eight initial pairings, unique ranking 1–8, European qualification and 16+16 redistribution with two qualifiers per European cup per group passed.
- European away goals, Coppa Italia direct penalties, played Golden Goal scoring and retained tiebreak winners passed.
- Consecutive-yellow diffida/suspension, second-yellow dismissal, one-match ban recovery, timed injury recovery, bounded defaults and duplicate condition-finalization tests passed.
- Substitution limits, no return, injury/suspension exclusions, standalone condition round-trip and career identity preservation passed.
- Played match lifecycle/halftime and duplicate launch tests passed in an isolated JavaScript VM. Played career-cup lifecycle restored original fixtures, standings, results and league round.
- Save API tests passed against an asynchronous in-memory IndexedDB model: immutable snapshots, separate career slots, collision-safe imports, malformed JSON handling and cup-context write exclusion.
- `git diff --check` passed. Work remains on `v10-final-audit`; existing staged files and the pre-existing React workspace were preserved.

## Remaining known limitations

- Real-browser interaction, screenshots, actual IndexedDB persistence, desktop Safari and physical iPhone Safari/Chrome were **not verified**. Headless Chrome launched, but local-server and browser-control approvals were rejected. VM tests do not certify rendering, touch geometry, browser storage behaviour or audio.
- GitHub Pages serving was checked statically, not through a deployed site or local HTTP session. The root game still loads directly from `index.html` with relative assets and no build step.
- Existing CPU cup fast-forward behaviour, automatic first-season European competitions, and strength-based ordering within Final Eight losing rounds remain. CPU extra time is a compact Golden Goal/penalty simulation rather than a minute-by-minute extension.
- The upload manifest lists this audit's changes only. The pre-existing README edits and separate React application were not removed, migrated, or synchronized with the root game.
