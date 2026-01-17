# Phase 7: Testing & Documentation - Agent Prompt

**Target Agent:** Fresh context window agent  
**Phase:** 7 of 8 (Testing & Final Documentation)  
**Estimated Duration:** 3-4 hours  
**Prerequisites:** Phase 6 UI verification complete and summarized

---

## Your Mission

Execute and validate all Copilot CLI tests, expand test coverage for edge cases, complete documentation with screenshots, perform quality assurance testing, and prepare release materials.

---

## Critical Context

From Phase 6 ([Phase-06-Implementation-Summary.md](Phase-06-Implementation-Summary.md)):
- **Key Finding**: Maestro's unified architecture means NO new UI code was needed
- All Copilot features work through existing components (SessionList, SessionItem, ProcessManager)
- 25 E2E tests written but not yet executed with Playwright
- User documentation complete (4100 words) but missing screenshots
- 124 total tests exist (99 unit + 25 E2E)

### Current Test Status

**Unit Tests (Passing)**:
- ✅ `copilot-output-parser.test.ts`: 42 tests
- ✅ `copilot-spawning.test.ts`: 27 tests
- ✅ `copilot-sessions.test.ts`: 30 tests

**E2E Tests (Written, Not Run)**:
- ⏸️ `copilot-ui.spec.ts`: 25 tests (needs Playwright execution)

**Integration Tests (Missing)**:
- ❌ No integration-level session storage tests yet

---

## Testing & Documentation Tasks

### Task 1: Execute E2E Test Suite
- Set up Playwright environment if not already configured
- Run `copilot-ui.spec.ts` against live Maestro app
- Fix any test failures (expect some due to test environment setup)
- Document test results with pass/fail counts
- Create screenshots/videos of test execution if helpful
- Update test file with any necessary fixes

**Expected Issues**:
- Test selectors may not match actual DOM (update `data-testid` attributes)
- Timeouts may need adjustment for slower CI environments
- Mock Copilot binary might be needed for deterministic testing

**Success Criteria**:
- [ ] All 25 E2E tests execute without errors
- [ ] At least 20/25 tests passing (80% pass rate acceptable)
- [ ] Failed tests have documented reasons and fixes planned
- [ ] Test execution time reasonable (<5 minutes total)

### Task 2: Add Integration Tests
- Create `src/__tests__/integration/copilot-integration.test.ts`
- Test session storage integration:
  - Session persists to electron-store after creation
  - Session retrieved correctly on app "restart" (mock)
  - Session metadata accurate (model, timestamp, state)
- Test ProcessManager integration:
  - Copilot process spawns with correct args
  - Resume adds `--continue` flag
  - Session ID emitted after process completion
- Test IPC layer integration:
  - Spawn IPC call routes to ProcessManager correctly
  - Data events flow from process to renderer
  - Error events handled properly

**Minimum 6 Integration Tests**:
1. ✅ Session created and stored in electron-store
2. ✅ Session retrieved from store on app initialization
3. ✅ ProcessManager emits session-id for Copilot
4. ✅ Resume builds args with --continue flag
5. ✅ IPC spawn handler applies Copilot config correctly
6. ✅ Error detection triggers IPC error events

**Success Criteria**:
- [ ] At least 6 integration tests created
- [ ] All integration tests passing
- [ ] Tests cover main process ↔ renderer communication
- [ ] Tests validate session storage persistence

### Task 3: Manual QA Testing
- Install Copilot CLI locally (if not already installed)
- Test complete user workflows manually:
  1. Create new Copilot session with initial prompt
  2. Verify output streams in real-time
  3. Copy transcript and verify content
  4. Resume session with follow-up prompt
  5. Verify `--continue` flag in process monitor
  6. Change model in settings
  7. Create new session with new model
  8. Test error handling (trigger auth error, rate limit, etc.)
  9. Test keyboard shortcuts (if implemented)
  10. Verify session persists after app restart

**Create QA Test Report**:
- Document each workflow tested
- Note any bugs or UX issues discovered
- Capture screenshots of key features
- Record any performance issues (slow responses, UI lag)

**Success Criteria**:
- [ ] All 10 workflows tested and documented
- [ ] Critical bugs identified and logged (if any)
- [ ] Screenshots captured for documentation
- [ ] QA report created in `Copilot CLI Implementation/Phase-07-QA-Report.md`

### Task 4: Expand User Documentation
- Add screenshots to `docs/copilot-cli-usage.md`:
  - Session creation dialog
  - Session list with Copilot sessions
  - Resume prompt dialog
  - Streaming output display
  - Error banner example
  - Settings section
  - (Minimum 6 screenshots)
- Add troubleshooting examples with real error messages
- Include example prompts for common use cases
- Add "Quick Start" section at the top for new users
- Create video walkthrough (optional, if time permits)

**Success Criteria**:
- [ ] At least 6 screenshots added to documentation
- [ ] Screenshots show actual Maestro UI (not mockups)
- [ ] Quick Start section added (~300 words)
- [ ] Troubleshooting section expanded with real examples

### Task 5: Performance & Stress Testing
- Test with large session counts:
  - Create 50+ Copilot sessions
  - Verify UI remains responsive
  - Check session list render time
- Test with long conversations:
  - Resume a session 10+ times
  - Verify output doesn't cause memory issues
  - Check transcript scrolling performance
- Test concurrent sessions:
  - Run 3-5 Copilot sessions simultaneously
  - Verify output routing to correct sessions
  - Check for any race conditions

**Create Performance Report**:
- Document session count limit (if any)
- Note any UI slowdowns or memory leaks
- Record maximum conversation length tested
- List any performance recommendations

**Success Criteria**:
- [ ] Tested with 50+ sessions
- [ ] Tested with 10+ resume cycles
- [ ] Tested with 3-5 concurrent sessions
- [ ] Performance report created
- [ ] No critical performance issues found

### Task 6: Regression Testing
- Run full existing test suite: `npm test`
- Verify zero regressions in other agents:
  - Claude Code tests still passing
  - Codex tests still passing
  - OpenCode tests still passing
  - Terminal tests still passing
- Check that Copilot changes didn't break any existing features
- Validate ProcessManager still handles all agents correctly

**Success Criteria**:
- [ ] All existing tests passing (pre-Copilot tests)
- [ ] No regressions in other agents
- [ ] Total test count increased (99 → 130+)

### Task 7: Release Preparation
- Create `docs/releases/copilot-cli-release-notes.md`
- Document new features for users:
  - GitHub Copilot CLI integration
  - Model selection (Claude, GPT, Gemini)
  - Session resume with --continue
  - Configuration options
- List installation requirements (Copilot CLI subscription)
- Add upgrade notes (if existing users need to do anything)
- Include known limitations
- Draft announcement post (for blog/Discord/etc.)

**Success Criteria**:
- [ ] Release notes created (~500 words)
- [ ] Features clearly explained
- [ ] Installation steps documented
- [ ] Known limitations disclosed

---

## Testing Strategy

### Unit Test Execution
```bash
# Run all Copilot unit tests
npm test -- copilot

# Expected: 99 tests passing
```

### E2E Test Execution
```bash
# Run Copilot UI tests with Playwright
npx playwright test e2e/copilot-ui.spec.ts

# Expected: 25 tests, 20+ passing
```

### Integration Test Execution
```bash
# Run integration tests (once created)
npm test -- integration/copilot

# Expected: 6+ tests passing
```

### Full Regression Suite
```bash
# Run all tests to verify no regressions
npm test

# Expected: 130+ tests passing (99 existing + 30 new)
```

---

## Success Criteria

### ✅ Testing Complete
- [ ] All 99 unit tests still passing
- [ ] 20+ of 25 E2E tests passing (80%+)
- [ ] 6+ integration tests created and passing
- [ ] Manual QA completed with report
- [ ] Performance testing completed with report
- [ ] Zero regressions in existing tests

### ✅ Documentation Complete
- [ ] User guide expanded with screenshots
- [ ] Quick Start section added
- [ ] Troubleshooting examples updated
- [ ] QA report created
- [ ] Performance report created
- [ ] Release notes drafted

### ✅ Quality Assurance
- [ ] All critical bugs identified and logged
- [ ] No major UX issues discovered
- [ ] Performance acceptable (tested with 50+ sessions)
- [ ] Error handling validated with real errors

### ✅ Release Readiness
- [ ] Release notes drafted
- [ ] Documentation complete
- [ ] All tests passing (>85% overall)
- [ ] Known issues documented

---

## Implementation Steps

### Step 1: Set Up Test Environment (30 min)
1. Install Playwright if not already installed: `npm install -D @playwright/test`
2. Configure Playwright for Electron: Update `playwright.config.ts`
3. Verify Copilot CLI installed: `which copilot`
4. Run `copilot auth` to authenticate
5. Build Maestro: `npm run build`

### Step 2: Execute E2E Tests (60 min)
1. Run E2E test suite: `npx playwright test e2e/copilot-ui.spec.ts`
2. Review failures and identify causes
3. Update test selectors if DOM structure differs
4. Adjust timeouts for CI environment
5. Re-run until acceptable pass rate (80%+)
6. Document results in Phase-07-Implementation-Summary.md

### Step 3: Create Integration Tests (60 min)
1. Create `src/__tests__/integration/copilot-integration.test.ts`
2. Write 6 integration tests (see Task 2)
3. Use Vitest with mock IPC layer
4. Test session storage with electron-store mock
5. Test ProcessManager with mock spawn
6. Run and verify all pass

### Step 4: Manual QA (60 min)
1. Launch Maestro in dev mode
2. Execute 10 QA workflows (see Task 3)
3. Capture screenshots during testing
4. Note any bugs or issues
5. Create QA report with findings
6. Log critical bugs in issue tracker

### Step 5: Documentation Enhancement (45 min)
1. Add screenshots to user guide (6 minimum)
2. Write Quick Start section (300 words)
3. Expand troubleshooting with real examples
4. Update FAQ based on QA findings
5. Review and polish all documentation

### Step 6: Performance & Stress Testing (30 min)
1. Create 50 Copilot sessions
2. Test session list performance
3. Resume single session 10+ times
4. Test concurrent sessions (3-5 at once)
5. Document performance metrics
6. Note any issues or limits

### Step 7: Regression & Release Prep (45 min)
1. Run full test suite: `npm test`
2. Verify no regressions in other agents
3. Draft release notes
4. Create upgrade guide if needed
5. List known issues and limitations
6. Prepare announcement post

---

## Expected Deliverables

### 1. Phase-07-Implementation-Summary.md
Document the execution of Phase 7 including:
- E2E test results (pass/fail counts, issues found)
- Integration test implementation and results
- QA testing report summary
- Performance testing results
- Documentation enhancements made
- Release readiness assessment
- Known issues and limitations
- Handoff to Phase 8 (if applicable) or release readiness statement

### 2. Phase-07-QA-Report.md
Manual testing report including:
- 10 tested workflows with pass/fail status
- Screenshots of key features
- Bugs discovered (if any)
- UX improvement suggestions
- Performance observations

### 3. src/__tests__/integration/copilot-integration.test.ts
New integration test file with:
- 6+ integration tests
- Session storage tests
- ProcessManager integration tests
- IPC communication tests
- 100% pass rate

### 4. docs/copilot-cli-usage.md (Updated)
Enhanced user guide with:
- Quick Start section (new)
- 6+ screenshots embedded
- Updated troubleshooting with real examples
- Expanded FAQ based on testing

### 5. docs/releases/copilot-cli-release-notes.md
Release notes including:
- Feature overview
- Installation requirements
- Configuration guide
- Known limitations
- Upgrade notes

### 6. Update Master Documentation
Modify these files:
- `START_HERE.md` - Update to show Phase 7 complete, project 100% done
- `PROGRESS_TRACKER.md` - Mark Phase 7 ✅, project complete
- `README.md` - Add Copilot CLI to supported agents list

---

## Expected Document Structure After Completion

```
Copilot CLI Implementation/
├── Phase-05-Agent-Prompt.md              ← Phase 5 task list (reference)
├── Phase-05-Implementation-Summary.md    ← Phase 5 results (reference)
├── Phase-06-Agent-Prompt.md              ← Phase 6 task list (reference)
├── Phase-06-Implementation-Summary.md    ← Phase 6 results (reference)
├── Phase-07-Agent-Prompt.md              ← This file (reference)
├── Phase-07-Implementation-Summary.md    ← CREATE: Your test & doc results
├── Phase-07-QA-Report.md                 ← CREATE: Manual testing report
├── START_HERE.md                         ← UPDATE: Mark project complete
└── PROGRESS_TRACKER.md                   ← UPDATE: Show 100% complete

src/__tests__/integration/
└── copilot-integration.test.ts           ← CREATE: Integration tests

docs/
├── copilot-cli-usage.md                  ← UPDATE: Add screenshots, Quick Start
└── releases/
    └── copilot-cli-release-notes.md      ← CREATE: Release announcement
```

---

## Key Questions to Answer Before Starting

Read the code and verify (don't guess):

1. Is Playwright already configured in `playwright.config.ts`?
2. Where are existing E2E tests located and how are they structured?
3. How do other agents handle E2E testing (reference: `e2e/` directory)?
4. What is the structure of existing integration tests (reference: `src/__tests__/` directory)?
5. How are screenshots typically embedded in Maestro docs?
6. Where should release notes be stored (in `docs/releases/` or root)?

---

## Common Pitfalls to Avoid

### Testing Pitfalls
- **Flaky Tests**: E2E tests can be flaky due to timing. Add appropriate waits.
- **Environment Setup**: Tests may fail if Copilot CLI not authenticated
- **Mock vs Real**: Decide whether to mock `copilot` binary or use real one
- **Selector Fragility**: Use `data-testid` attributes instead of CSS classes

### Documentation Pitfalls
- **Outdated Screenshots**: Ensure screenshots match current UI
- **Missing Context**: Explain WHY features exist, not just HOW to use them
- **Overpromising**: Don't document features that don't fully work yet
- **Jargon Overload**: Keep language accessible for new users

### Performance Pitfalls
- **Memory Leaks**: Large session counts could expose memory issues
- **Unbounded Arrays**: Long transcripts could cause UI slowdown
- **Race Conditions**: Concurrent sessions might expose synchronization issues

---

## Testing Tips

### E2E Testing
- Start Maestro in test mode: `MAESTRO_TEST_MODE=1 npm start`
- Use Playwright's debug mode for troubleshooting: `npx playwright test --debug`
- Check test output videos in `test-results/` directory
- Consider using Playwright's `page.pause()` for interactive debugging

### Integration Testing
- Mock electron-store to avoid file I/O: `vi.mock('electron-store')`
- Mock ProcessManager spawn to avoid real process creation
- Use Vitest's `beforeEach` to reset mocks between tests
- Test both success and failure paths

### Manual Testing
- Use Process Monitor to verify command args
- Check log files for detailed debug output
- Test with different models to ensure flexibility
- Try edge cases (empty prompts, very long prompts, special characters)

---

## Phase 8 Preview (If Applicable)

**Note**: Phase 8 may not be necessary if testing and documentation are comprehensive in Phase 7.

If a Phase 8 is needed, it would cover:
- Final polish and bug fixes
- Beta testing with real users
- Performance optimizations
- Advanced features (if any)

However, the goal is to **complete the project in Phase 7** if possible.

---

## Success Definition

Phase 7 is successful when:
1. ✅ All tests passing (>85% overall pass rate)
2. ✅ Documentation complete with screenshots
3. ✅ QA report documents successful workflows
4. ✅ Performance validated with stress testing
5. ✅ Release notes drafted and ready
6. ✅ Zero critical bugs remaining
7. ✅ Project declared "release ready"

---

**You're ready! Execute Phase 7 now, validate all functionality, and prepare for release.**

---

## Reference Materials

- **Phase 6 Summary**: [Phase-06-Implementation-Summary.md](Phase-06-Implementation-Summary.md)
- **Phase 5 Summary**: [Phase-05-Implementation-Summary.md](Phase-05-Implementation-Summary.md)
- **E2E Tests**: `e2e/copilot-ui.spec.ts`
- **User Documentation**: `docs/copilot-cli-usage.md`
- **Existing Tests**: `src/__tests__/main/copilot-*.test.ts`
- **Playwright Config**: `playwright.config.ts`
- **Agent Definition**: `src/main/agent-detector.ts`

---

**Phase 7 Ready to Start:** January 17, 2026  
**Target Completion:** Same day  
**Goal:** Ship Copilot CLI integration 🚀
