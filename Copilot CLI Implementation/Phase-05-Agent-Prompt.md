# Phase 5: Session Storage Integration - Agent Prompt

**Target Agent:** Fresh context window agent
**Phase:** 5 of 8 (Session Storage & Management)
**Estimated Duration:** 1-2 hours
**Prerequisites:** Phases 1-4 complete and verified

---

## Your Mission

Implement session state persistence for GitHub Copilot CLI within Maestro's session management system. This allows users to resume Copilot conversations across Maestro restarts.

---

## Critical Context

### What Previous Phases Accomplished

**Phase 1-2: Agent Definition Complete**
- Copilot agent definition in `src/main/agent-detector.ts` (lines 174-215)
- All required agent fields configured (batchModeArgs, promptArgs, modelArgs, resumeArgs)
- Error patterns defined for detection

**Phase 3: Output Parser Complete**
- `CopilotOutputParser` in `src/main/parsers/copilot-output-parser.ts`
- Handles plain text output
- Detects errors even with exit code 0
- Registered and available via `getOutputParser('copilot-cli')`

**Phase 4: Spawning Integration Complete**
- Process spawning fully functional
- Command building works: `copilot -p "prompt" --allow-all-tools --silent`
- Error detection integrated
- Model selection implemented
- Session resume flag `--continue` is built into commands
- 27 integration tests passing (100%)

### How Copilot's Session System Works

**Copilot Manages Sessions Internally:**
```
~/.copilot/session-state/   <- Where Copilot stores sessions
├── session_1/
├── session_2/
└── ...
```

**Session Resume:**
- Run: `copilot -p "continue prompt" --continue`
- Copilot automatically resumes the most recent session
- No manual session ID tracking needed
- Exit code 0 even if permission denied

**In Maestro Context:**
- User can ask "continue from previous copilot session"
- Maestro should set `isResume: true` in spawn options
- `buildAgentArgs()` will add `--continue` flag
- Copilot resumes automatically from `~/.copilot/session-state/`

---

## Your Tasks for Phase 5

### Task 1: Understand Session Management
**Goal:** Learn how Maestro currently manages sessions for other agents

**Steps:**
1. Open `src/main/agent-detector.ts` and find the `AgentDetector.getAgent()` method
2. Find where sessions are stored/retrieved (search for `sessionIdEmitted`, `session-id` events)
3. Check `ProcessManager` for session ID extraction logic
4. Look for how other agents (Claude Code, OpenCode) handle sessions

**Key Files to Review:**
- `src/main/process-manager.ts` - Session ID handling
- `src/main/parsers/agent-output-parser.ts` - Interface definition
- `src/main/ipc/handlers/process.ts` - IPC session handling

**What to Find:**
- Where session IDs are extracted from agent output
- How sessions are tracked in Maestro
- How resume works for other agents

### Task 2: Handle Copilot's Session Behavior
**Goal:** Implement session handling for Copilot's unique model (internal management)

**Steps:**
1. Modify `CopilotOutputParser.extractSessionId()` if needed
   - Currently returns `null` (Copilot manages internally)
   - Consider returning a stable session identifier for Maestro's tracking

2. Consider implementing session state tracking:
   - Track that Copilot session is "active" 
   - Store session metadata in Maestro's session system
   - Enable "continue from last Copilot session" UI option

3. Update session resume logic:
   - Verify `--continue` flag is sent when `isResume: true`
   - Ensure session metadata persists across Maestro restarts

**Key Consideration:**
> Copilot doesn't provide session IDs in output, but we can create stable identifiers like `copilot-latest-session` or use timestamps.

### Task 3: Integrate with Session Storage
**Goal:** Connect Copilot sessions to Maestro's session management

**Steps:**
1. Find session storage implementation (search for session files/database)
2. Implement session persistence:
   - Save session metadata when Copilot session is created
   - Track session "last used" timestamp
   - Store selected model for the session
   - Store session status (active, completed, etc.)

3. Implement session retrieval:
   - Load previous Copilot sessions when app starts
   - Make sessions available in session list UI
   - Support "resume this session" action

4. Implement session cleanup:
   - Handle when Copilot is uninstalled
   - Clean up stale sessions
   - Archive old sessions if needed

**Key Files to Modify:**
- Session storage implementation (find via `sessionsStore` references)
- `CopilotOutputParser` for session metadata extraction
- `ProcessManager` or IPC handlers for session creation/resumption

### Task 4: Test Session Functionality
**Goal:** Verify session persistence works correctly

**Tests to Create:**
1. Session creation test
   - Run Copilot query in session
   - Verify session is tracked

2. Session retrieval test
   - Close and reopen Maestro
   - Verify previous Copilot sessions are available

3. Session resume test
   - Resume previous Copilot session
   - Verify `--continue` flag is sent
   - Verify new response appends to session

4. Session metadata test
   - Verify model is preserved across sessions
   - Verify session timestamps correct
   - Verify session list order (most recent first)

5. Multiple sessions test
   - Create multiple Copilot sessions
   - Verify each can be resumed independently
   - Verify session isolation

**Coverage Target:** >80% test coverage for session code

### Task 5: Documentation & Handoff
**Goal:** Prepare for Phase 6 (UI Integration)

**Create:**
1. Implementation summary document
   - What session system you implemented
   - How it integrates with Copilot
   - Any design decisions made

2. Test results
   - Number of tests created
   - Coverage percentage
   - Any edge cases found

3. Known issues or considerations
   - Anything that Phase 6 needs to know
   - UI requirements for session management
   - Any limitations discovered

---

## Reference Architecture

### Command with Session Resume
```typescript
// buildAgentArgs() produces:
copilot --allow-all-tools --silent -p "prompt text" --continue
         [batch mode args]                 [prompt] [resume flag]
```

### Session Flow
```
User Request (resume session)
  ↓
ProcessManager.spawn() called with isResume: true
  ↓
buildAgentArgs() adds --continue flag
  ↓
Copilot CLI loads ~/.copilot/session-state/
  ↓
Continues most recent session
  ↓
Returns plain text response
  ↓
CopilotOutputParser handles output
  ↓
Session metadata updated in Maestro
```

---

## Key Constraints & Considerations

### Copilot's Automatic Session Management
- ✅ Copilot manages sessions automatically in `~/.copilot/session-state/`
- ✅ `--continue` flag resumes the most recent session
- ❌ No way to select specific session (always resumes most recent)
- ❌ No session IDs returned in output

### Maestro's Session System Requirements
- Session must be tracked across app restarts
- Session must support "resume" action
- Session model/options should be preserved
- Multiple concurrent sessions should work

### Testing Requirements
- Session persists after Maestro restart
- Session list UI shows Copilot sessions
- Resuming session sends correct `--continue` flag
- Exit code 0 errors are detected in resumed sessions

---

## Success Criteria

✅ **Implementation Complete When:**
1. Session metadata persists to disk/database
2. Sessions are retrieved on app startup
3. Resume action sends `--continue` flag
4. Session list shows Copilot sessions with timestamps
5. Tests cover all session functionality (>80% coverage)
6. No regression in existing tests
7. TypeScript compiles cleanly
8. Documentation for Phase 6 is clear

✅ **Deliverables:**
- Modified session management code
- Session persistence implementation
- >80% test coverage
- Implementation summary document

---

## Gap Analysis: Missing Pieces for Full Copilot CLI Integration

Before you wrap Phase 5, identify and document what remains for a truly complete Copilot CLI integration across the app. Use this checklist to drive a short gap analysis and open tasks for Phase 6 and beyond.

### Functional Gaps
- UI resume flow: Ensure a clear "Resume Copilot" action exists and maps to `isResume: true`.
- Multiple sessions visibility: Decide whether Maestro should expose a list of Copilot sessions (even if Copilot only resumes the latest) with metadata stored by Maestro.
- Model selection persistence: Confirm selected `modelId` is saved per Copilot session and reapplied on resume.
- Cancelation support: Verify users can cancel an in-flight Copilot process from the UI and that ProcessManager terminates cleanly.
- Output streaming: Confirm renderer receives and displays streamed plain text responses (line-buffered or chunked) with a responsive UI.

### Reliability and Error Handling
- Exit code 0 + error messaging: Ensure surfaced errors are visible in the UI and logged for diagnostics.
- Permission denied / policy errors: Provide clear, actionable messages and guidance instead of silent failures.
- Retries/backoff: Decide basic retry strategy for transient spawn failures and document it.
- Timeouts: Add reasonable timeouts for idle Copilot processes to avoid zombie sessions.

### UX & Settings
- Session list UI: Show Copilot sessions with timestamps, model, last activity; allow resume action.
- Settings: Toggle for `--allow-all-tools` and default model; explain implications.
- Activity timeline: Append responses to session history for later review.
- Keyboard shortcuts: Align resume/start actions with existing shortcuts if applicable.

### Security & Compliance
- Tool allowance gate: Provide a visual indicator when `--allow-all-tools` is enabled and document risks.
- Data paths: Document `~/.copilot/session-state/` usage and any Maestro-side storage locations.
- Telemetry/logging: Ensure logs do not capture sensitive prompts/output; redact where necessary.

### Testing & Docs
- E2E tests: Add UI-driven resume/create/stream/cancel flows via Playwright.
- Integration tests: Cover session persistence and ProcessManager lifecycle events.
- Docs: Update `docs/cli.md` and `docs/general-usage.md` with Copilot usage, settings, and resume guidance.

### Decision Log Items
- Session identification approach for Maestro (e.g., generated UUID with metadata vs. implicit "latest").
- Whether to surface multiple Copilot sessions to users or keep a single "latest".
- Default model choice and whether users can change it per session.
- Error surfacing strategy in UI (toast, inline, log panel).

Deliver a short Gap Analysis note summarizing confirmed items vs. open items, with links to code locations and proposed owners.

---

## File Locations for Reference

**Agent Definition:**
- `src/main/agent-detector.ts` (lines 174-215)

**Output Parser:**
- `src/main/parsers/copilot-output-parser.ts`

**Process Manager:**
- `src/main/process-manager.ts`

**Session Handling (find these):**
- Search for `sessionIdEmitted` - finds session ID extraction
- Search for `session-id` event - finds session storage
- Search for `sessionsStore` - finds session persistence
- Search for `resumeArgs` - finds session resume logic

**Tests:**
- `src/__tests__/main/copilot-spawning.test.ts` (reference for testing pattern)
- `src/__tests__/main/parsers/copilot-output-parser.test.ts` (reference)

---

## Phase 4 Handoff Summary

Copilot is **fully operational** for basic queries:
- ✅ Agent registered and available
- ✅ Output parsing works
- ✅ Error detection working
- ✅ Model selection implemented
- ✅ Resume flag building ready
- ✅ Zero regressions

Your job: Make sessions persistent so users can resume conversations.

---

## Questions to Answer Before Starting

1. Where does Maestro currently store session metadata?
2. How are other agents' sessions currently managed?
3. What session data needs to be preserved (model, timestamp, etc.)?
4. Should we use a stable session ID like `copilot-latest` or track multiple sessions?
5. How should session list UI display Copilot sessions?

**Answer these by reading existing code, not by speculation.**

---

## Final Notes

- **Don't overthink sessions:** Copilot handles the heavy lifting
- **Focus on storage:** Your main job is making sessions persist in Maestro
- **Use existing patterns:** Don't invent new session handling, follow what works for other agents
- **Test thoroughly:** Session management is critical for user experience
- **Document well:** Phase 6 needs to understand how to show sessions in UI

You've got this! Phase 4 proved the architecture works. Now make sessions stick around.

**Good luck!** 🚀
