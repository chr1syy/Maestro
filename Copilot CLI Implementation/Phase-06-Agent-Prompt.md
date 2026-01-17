# Phase 6: UI Integration - Agent Prompt

**Target Agent:** Fresh context window agent
**Phase:** 6 of 8 (UI Integration)
**Estimated Duration:** 2-3 hours
**Prerequisites:** Phase 5 session storage complete and summarized

---

## Your Mission

Integrate Copilot CLI sessions into Maestro's UI: show session lists, enable resume actions, stream outputs responsively, surface errors clearly, and expose relevant settings.

---

## Critical Context

From Phase 5 ([Phase-05-Implementation-Summary.md](Phase-05-Implementation-Summary.md)):
- Copilot sessions are persisted with metadata (timestamps, `modelId`, status)
- Copilot itself resumes the most recent internal session when `--continue` is provided
- Session IDs are generated in format: `copilot-session-{timestamp}`
- Sessions stored in electron-store via `sessionsStore`
- Output is plain text; renderer must stream/display chunks and append to transcript
- Errors can occur even with exit code 0; UI must surface these clearly

---

## UI Implementation Tasks

### Task 1: Session List UI Component
- Add a Copilot section in the Sessions view showing stored sessions with:
  - Title (e.g., first prompt snippet or generated name)
  - Last activity timestamp
  - Model indicator (from session metadata)
  - Status (active/completed)
- Sorting: most recent first
- Actions: Resume, View details, Delete/Archive
- Integration: Fetch sessions from Maestro's session store via IPC

### Task 2: Resume Flow Implementation
- Wire "Resume" action to spawn API with `isResume: true`
- Ensure `ProcessManager` adds `--continue` flag to command
- Route streamed output into resumed session transcript
- Provide visual feedback during resume (spinner/progress)
- Verify correct arguments flow through buildAgentArgs()

### Task 3: Streaming Output Display Component
- Implement responsive text stream component:
  - Append lines/chunks as they arrive from ProcessManager
  - Auto-scroll behavior with user toggle
  - Copy transcript button
  - Export transcript option
  - Link output entries to active session
- Handle both new queries and resumed sessions
- Test with various output sizes and speeds

### Task 4: Error Surfacing & Handling
- Show inline error banners for detected errors:
  - Permission denied → "Run `copilot auth`"
  - Rate limit → "Wait before retrying"
  - Unknown error → Link to docs
- Provide "Learn more" link to documentation
- Integrate with log panel for advanced troubleshooting
- Ensure errors don't block session recovery

### Task 5: Settings & Configuration UI
- Add settings section for Copilot:
  - Default model selector (dropdown with available models)
  - Allow tools (`--allow-all-tools`) toggle with caution note
  - Context window size input
- Wire settings to configuration storage
- Apply settings to new queries (not running queries)
- Show which settings are active in session view

### Task 6: Keyboard Shortcuts
- Add/align shortcuts:
  - New Copilot query: Cmd+Shift+C (Mac) / Ctrl+Shift+C (Windows/Linux)
  - Resume latest: Cmd+Option+C (Mac) / Ctrl+Alt+C (Windows/Linux)
- Document shortcuts in help/settings
- Verify shortcuts don't conflict with existing ones
- Show shortcuts in context menus

---

## Implementation Steps

1. Review Phase 5 implementation:
   - Read [Phase-05-Implementation-Summary.md](Phase-05-Implementation-Summary.md)
   - Understand session storage structure
   - Review ProcessManager session ID emission

2. Create React components:
   - `CopilotSessionList.tsx` - Main session list view
   - `CopilotSessionItem.tsx` - Individual session row
   - `CopilotResumeDialog.tsx` - Resume confirmation dialog
   - `CopilotStreamingOutput.tsx` - Real-time output display
   - `CopilotErrorBanner.tsx` - Error message display
   - `CopilotSettings.tsx` - Settings section

3. Implement IPC wiring:
   - Fetch sessions: `sessions:getAll` → Display in list
   - Resume session: `process:spawn` with `isResume: true`
   - Update settings: `settings:set` for model/tools
   - Listen to process events: `process:data`, `process:error`, `process:session-id`

4. Connect ProcessManager events:
   - Verify renderer receives `process:data` events
   - Verify renderer receives `process:error` events
   - Verify renderer receives `process:session-id` events
   - Route all events to active session display

5. Persist UI state:
   - Save last viewed session ID
   - Save scroll position per session
   - Save settings changes immediately
   - Load UI state on app startup

6. Add documentation:
   - Update `docs/copilot-cli.md` with UI usage guide
   - Add screenshots (session list, resume, streaming output, error, settings)
   - Update `docs/general-usage.md` with Copilot section
   - Add troubleshooting for common UI issues

---

## Testing Strategy

### Unit Tests (Vitest)
- Test session list rendering with mock data
- Test error banner component with different error types
- Test settings persistence
- Test IPC message formatting

### Integration Tests (Vitest)
- Test IPC flow: spawn with `isResume: true`
- Test session update after spawn
- Test settings application to new query
- Test error detection and display

### E2E Tests (Playwright)
- Create session, verify appears in UI
- Resume session, verify output appends
- Trigger error, verify banner displays
- Toggle settings, verify applied to next query
- Test keyboard shortcuts work

### Regression Testing
- Run full test suite: `npm test`
- Verify all 99+ Copilot tests still pass
- Verify no impact on other agents
- Coverage target: >80% for UI code

---

## Success Criteria

✅ **Functionality:**
- Copilot sessions appear in UI with accurate metadata
- Sessions sorted by most recent first
- Resume action sends `--continue` flag
- Streaming output displayed in real-time
- Errors surfaced clearly with actionable guidance
- Settings control model and tool allowance
- Keyboard shortcuts functional

✅ **Code Quality:**
- React components follow Maestro patterns
- IPC communication properly typed
- No TypeScript errors or warnings
- All components tested (unit + integration)
- >80% code coverage for UI code

✅ **User Experience:**
- Session list responsive and performant
- Streaming output smooth with auto-scroll
- Error messages clear and helpful
- Settings UI intuitive
- Shortcuts documented

✅ **Documentation:**
- User guide created or updated
- Screenshots included (5+)
- Troubleshooting section complete
- Settings explained clearly

---

## Handoff Requirements

When Phase 6 is complete, you MUST create three documents:

### 1. Phase-06-Implementation-Summary.md
Document your implementation including:
- Components created (list, dialog, output pane, error banner, settings)
- IPC endpoints used and verified
- UI patterns followed and why
- Edge cases discovered and handled
- Test results and coverage metrics
- Screenshots/artifacts
- Known limitations or future improvements
- Reference to Phase-05-Implementation-Summary.md

### 2. Phase-07-Agent-Prompt.md
Create the detailed task specification for Phase 7:
- E2E test requirements (10+ scenarios via Playwright)
- Integration test requirements (6+ test suites via Vitest)
- User documentation requirements (~2000 words)
- Quality assurance criteria (>85% coverage, 0 regressions)
- Files to create and modify
- Testing strategy and implementation timeline
- Success criteria and deliverables
- Handoff requirements for Phase 8

### 3. Update Master Documentation
Modify these files:
- START_HERE.md - Update to show Phase 6 complete, Phase 7 ready
- PROGRESS_TRACKER.md - Mark Phase 6 ✅, Phase 7 🔵 Ready

---

## Expected Document Structure After Completion

```
Copilot CLI Implementation/
├── Phase-05-Agent-Prompt.md              ← Phase 5 task list (reference)
├── Phase-05-Implementation-Summary.md    ← Phase 5 results (reference)
├── Phase-06-Agent-Prompt.md              ← This file (reference)
├── Phase-06-Implementation-Summary.md    ← CREATE: Your implementation details
├── Phase-07-Agent-Prompt.md              ← CREATE: Next agent's task list
├── START_HERE.md                         ← UPDATE: Point to Phase 7
└── PROGRESS_TRACKER.md                   ← UPDATE: Show Phase 7 ready
```

---

## Key Files to Review Before Starting

1. [Phase-05-Implementation-Summary.md](Phase-05-Implementation-Summary.md) - Session storage context
2. `src/renderer/types/index.ts` - Session and AITab interfaces
3. `src/main/index.ts` - Session event handling (search for `processManager.on('session-id'`)
4. `src/main/ipc/handlers/persistence.ts` - Session storage IPC handlers
5. Existing session/tab components in `src/renderer/components/`
6. Existing agent configuration patterns in `src/renderer/` components

---

## Questions to Answer Before Coding

Read the code and answer (don't guess):
1. How are existing sessions displayed in current UI?
2. How do other agents (Claude Code, OpenCode) handle resume in UI?
3. What IPC endpoints exist for session management?
4. What React component patterns does Maestro use?
5. How are errors currently surfaced to users?
6. Where are settings stored and how are they accessed?

---

**You're ready! Execute Phase 6 now, then create your handoff for Phase 7.**
