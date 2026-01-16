# Phase 7: Testing & Documentation

Comprehensive testing, documentation, and final verification.

## Prerequisites

- [ ] Phase 1-6 all completed and verified
- [ ] All code is implemented and compiles without errors
- [ ] Manual E2E testing has been performed

## Testing Tasks

### 7.1 Unit Test Coverage

**All Copilot-related files should have corresponding unit tests:**

- [ ] `copilot-output-parser.test.ts`
  - [ ] Text event parsing
  - [ ] Error event parsing
  - [ ] Session ID extraction
  - [ ] Malformed input handling
  - [ ] Edge cases (empty responses, special characters)

- [ ] `agent-detector.test.ts` (Copilot section)
  - [ ] Copilot agent definition is valid
  - [ ] Configuration options are accessible
  - [ ] Capabilities are correctly defined
  - [ ] Binary detection works

- [ ] `agent-capabilities.test.ts` (Copilot section)
  - [ ] Capabilities object is complete
  - [ ] All boolean flags are set correctly
  - [ ] No undefined capabilities

- [ ] `error-patterns.test.ts` (Copilot section, if patterns added)
  - [ ] Error patterns match Copilot errors
  - [ ] Recoverable flags are correct
  - [ ] Pattern matching works correctly

- [ ] Session storage tests (if applicable)
  - [ ] Session save and retrieve
  - [ ] Session listing
  - [ ] Session deletion
  - [ ] File I/O error handling

**Task:** Run all unit tests
```bash
npm run test
# All tests should pass with no warnings
```

Verification:
- [ ] All Copilot tests pass
- [ ] No test failures or warnings
- [ ] Coverage is >80% for new code

### 7.2 Integration Tests

**Integration test file:** `src/__tests__/integration/copilot-integration.test.ts`

Tests should verify end-to-end functionality:

- [ ] Agent spawning
  - [ ] Copilot binary is found
  - [ ] Arguments are built correctly
  - [ ] Process spawns successfully
  - [ ] Output is captured

- [ ] Output parsing
  - [ ] JSON output is parsed correctly
  - [ ] Events are mapped to ParsedEvent
  - [ ] Session ID is captured (if applicable)
  - [ ] Usage info is extracted (if applicable)

- [ ] Session management
  - [ ] Sessions are saved
  - [ ] Sessions can be resumed
  - [ ] Session list is accurate

- [ ] Configuration
  - [ ] Model selection works
  - [ ] Configuration is applied
  - [ ] Invalid config is handled

**Task:** Create integration tests
```bash
npm run test:integration
# Integration tests should pass
```

Verification:
- [ ] All integration tests pass
- [ ] Tests run without timeouts
- [ ] No flaky tests

### 7.3 E2E Tests

**E2E test file:** `e2e/copilot-e2e.spec.ts`

Tests should verify real user workflows:

- [ ] Complete workflow: Create session → Send message → Get response
- [ ] Configuration workflow: Change settings → Apply → Verify effect
- [ ] Error handling: Invalid input → Error message → Recovery
- [ ] Multiple sessions: Create multiple → Switch between → All work

**Task:** Run E2E tests
```bash
npm run test:e2e
# E2E tests should pass
```

Verification:
- [ ] All E2E tests pass
- [ ] Tests complete in reasonable time (<1 min per test)
- [ ] No flaky tests

### 7.4 Manual Testing Regression

**Comprehensive manual test checklist:**

- [ ] **Installation & Setup**
  - [ ] Copilot CLI is installed and in PATH
  - [ ] GitHub authentication works
  - [ ] No permission errors

- [ ] **Agent Detection**
  - [ ] Agent appears in settings
  - [ ] Shows as "available"
  - [ ] Correct icon displayed
  - [ ] Version info shown (if available)

- [ ] **Session Creation**
  - [ ] Can select Copilot in new session
  - [ ] Form validates correctly
  - [ ] Session saves with correct agent
  - [ ] Session appears in list

- [ ] **Basic Messaging**
  - [ ] Can send simple prompt
  - [ ] Response appears within reasonable time
  - [ ] Response is fully received
  - [ ] No truncation or corruption
  - [ ] Streaming works (if applicable)

- [ ] **Configuration**
  - [ ] Model can be changed in settings
  - [ ] Change persists after app restart
  - [ ] Model change affects new queries
  - [ ] Invalid config is rejected with error

- [ ] **Error Handling**
  - [ ] Network errors show clear message
  - [ ] Auth errors suggest login
  - [ ] Invalid model shows helpful error
  - [ ] Process crashes are handled gracefully

- [ ] **Session Management**
  - [ ] Multiple sessions can be created
  - [ ] Sessions are independent
  - [ ] Can switch between sessions
  - [ ] Previous messages are preserved
  - [ ] Sessions survive app restart

- [ ] **Performance**
  - [ ] UI is responsive while waiting
  - [ ] Large responses don't crash UI
  - [ ] Memory usage is reasonable
  - [ ] No memory leaks (check dev tools)

- [ ] **UI/UX**
  - [ ] Icon is clear and visible
  - [ ] Text is readable
  - [ ] Responsive on different screen sizes
  - [ ] Consistent with other agents
  - [ ] No layout issues

**Task:** Create manual testing report
Document results for:
- [ ] Device/OS tested
- [ ] App version tested
- [ ] Copilot CLI version tested
- [ ] Pass/fail for each test case
- [ ] Screenshots of any issues

## Documentation Tasks

### 7.5 Code Documentation

**Every new file and function should be documented:**

- [ ] `copilot-output-parser.ts`
  - [ ] Class docstring explaining purpose
  - [ ] Method docstrings with @param and @returns
  - [ ] Comments on complex logic

- [ ] `copilot-session-storage.ts` (if created)
  - [ ] Class docstring
  - [ ] Method docstrings
  - [ ] Storage format documented

- [ ] `agent-detector.ts` (Copilot section)
  - [ ] Agent definition comments
  - [ ] Configuration option descriptions
  - [ ] Links to Copilot CLI documentation

**Task:** Add JSDoc comments
```typescript
/**
 * GitHub Copilot CLI Output Parser
 * 
 * Transforms Copilot's JSON/JSONL format into normalized ParsedEvent format.
 * 
 * @example
 * const parser = new CopilotOutputParser();
 * const event = parser.parseJsonLine('{"type":"message","content":"Hello"}');
 */
export class CopilotOutputParser implements AgentOutputParser {
  /**
   * Parse a single line of JSON output from Copilot CLI
   * @param line - Single line of output
   * @returns Parsed event or null if not valid
   */
  parseJsonLine(line: string): ParsedEvent | null {
    // ...
  }
}
```

### 7.6 User Documentation

**Files to update:**

- [ ] `docs/getting-started.md`
  - [ ] Add Copilot CLI to list of supported agents
  - [ ] Include installation steps
  - [ ] Link to Copilot CLI documentation

- [ ] `docs/general-usage.md` or agent guide
  - [ ] Add Copilot CLI section
  - [ ] Explain model selection
  - [ ] Show example usage
  - [ ] Document limitations (if any)

- [ ] `AGENT_SUPPORT.md`
  - [ ] Add comprehensive Copilot CLI entry
  - [ ] Document all capabilities
  - [ ] List configuration options
  - [ ] Note any limitations or quirks

**Task:** Create documentation sections
```markdown
## GitHub Copilot CLI

GitHub Copilot CLI is a command-line interface for AI-powered code suggestions.

### Installation

1. Install GitHub CLI: https://cli.github.com/
2. Authenticate: `gh auth login`
3. Install Copilot extension: `gh extension install github/gh-copilot`
4. Verify: `copilot --version`

### Configuration

In Maestro settings, you can configure:
- **Model**: Select which Copilot model to use (gpt-4, gpt-3.5-turbo, etc.)

### Capabilities

- ✅ Batch queries
- ✅ Model selection
- ✅ JSON output
- ❌ Session resumption (not supported)
- ❌ Image input (not supported)

### Example Usage

1. Create new session
2. Select "GitHub Copilot CLI" as agent
3. Send prompt: "Write a factorial function in JavaScript"
4. Get response from Copilot

### Troubleshooting

**"Copilot CLI not found"**
- Ensure `gh` CLI is installed and in PATH
- Run `gh extension install github/gh-copilot`
- Restart Maestro

**"Authentication failed"**
- Run `gh auth login` to set up authentication
- Ensure you have GitHub API access
```

### 7.7 API Documentation

**If applicable, document the integration points:**

- [ ] Agent definition structure in `agent-detector.ts`
- [ ] Output parser interface in `parsers/agent-output-parser.ts`
- [ ] IPC handlers for spawning agents
- [ ] Session storage interface (if created)

**Task:** Create integration guide
```markdown
## Integrating Copilot CLI

### Agent Definition

Agent is defined in `src/main/agent-detector.ts`:

- `id`: 'copilot-cli'
- `name`: 'GitHub Copilot CLI'
- `binaryName`: 'copilot'
- Supports JSON output via `--output-format stream-json`
- Batch mode uses: `copilot chat`

### Output Format

Copilot outputs JSONL with events:
- `type: "message"` - Response content
- `type: "complete"` - Indicates end of response
- `type: "error"` - Error occurred

See `CopilotOutputParser` for parsing details.

### Configuration Options

Users can configure:
- Model selection (defaults to Copilot's default)

All options are optional and have sensible defaults.
```

### 7.8 Troubleshooting Guide

**Create troubleshooting documentation:**

- [ ] Common issues and solutions
- [ ] Debug steps and how to collect logs
- [ ] Error messages and what they mean
- [ ] When to report bugs vs. user error

**Task:** Create troubleshooting section
```markdown
## Troubleshooting Copilot CLI

### Issue: Agent shows as unavailable

**Symptoms:**
- GitHub Copilot CLI shows "unavailable" in settings

**Solutions:**
1. Ensure `gh` CLI is installed: `gh --version`
2. Install Copilot extension: `gh extension install github/gh-copilot`
3. Check binary is in PATH: `which copilot` (macOS/Linux)
4. Restart Maestro

### Issue: Authentication errors

**Symptoms:**
- "Unauthorized" or "Authentication failed" errors

**Solutions:**
1. Run: `gh auth login`
2. Follow GitHub authentication flow
3. Try running `copilot chat "test"` to verify
4. Restart Maestro

### Issue: No response from Copilot

**Symptoms:**
- Prompt is sent but no response appears
- UI shows loading forever

**Solutions:**
1. Check network connection
2. Verify Copilot works: `echo "hello" | copilot chat --format json`
3. Check browser console for errors (F12)
4. Check main process logs for errors
5. Try simpler prompt first

### Collecting Debug Information

To get help troubleshooting:
1. Open DevTools: F12
2. Check Console tab for errors
3. Check Network tab if using remote Copilot
4. Save error messages
5. File issue with: Copilot version, OS, Maestro version, full error message
```

## Release Preparation

### 7.9 Create Release Notes

**File:** Add to `docs/releases.md` or similar

- [ ] Feature summary
- [ ] Installation instructions
- [ ] Known issues
- [ ] Breaking changes (if any)

**Task:** Write release notes
```markdown
## Maestro X.Y.Z - GitHub Copilot CLI Support

### New Features

- **GitHub Copilot CLI Integration**: Use Copilot as an AI agent within Maestro
- Supports Copilot's latest models and features
- Full session management
- Configurable model selection

### Installation

1. Update Maestro to X.Y.Z
2. Install Copilot CLI: `gh extension install github/gh-copilot`
3. Configure in Settings > Agents > GitHub Copilot CLI

### Known Issues

- Sessions are not persisted between app restarts
- Image input is not supported
- Custom instructions are not available

### Contributors

Thank you to all who helped implement Copilot CLI support!
```

### 7.10 GitHub Issue Template

**Update issue templates to include Copilot CLI:**

- [ ] Bug report template includes agent field
- [ ] Feature request template mentions compatibility
- [ ] Ask for Copilot version in bug reports

## Final Verification Checklist

### Code Quality
- [ ] All new code has JSDoc comments
- [ ] No linting errors: `npm run lint`
- [ ] No TypeScript errors: `npm run build`
- [ ] Code style consistent with project
- [ ] No dead code or commented-out code

### Testing
- [ ] All unit tests pass: `npm run test`
- [ ] All integration tests pass: `npm run test:integration`
- [ ] All E2E tests pass: `npm run test:e2e`
- [ ] Test coverage >80% for new code
- [ ] Manual testing checklist completed
- [ ] No flaky tests

### Documentation
- [ ] Code comments are clear and accurate
- [ ] User guide is complete
- [ ] Setup instructions are correct
- [ ] Troubleshooting guide covers common issues
- [ ] API documentation is included
- [ ] Release notes are written

### Functionality
- [ ] Agent appears in agent list
- [ ] Can create sessions with Copilot
- [ ] Can send messages and receive responses
- [ ] Configuration options work
- [ ] Errors are handled gracefully
- [ ] Multiple sessions work independently
- [ ] UI is responsive

### Performance
- [ ] No memory leaks
- [ ] UI remains responsive
- [ ] Response times are acceptable
- [ ] Large responses are handled
- [ ] No console errors or warnings

### Compatibility
- [ ] Works on macOS
- [ ] Works on Linux
- [ ] Works on Windows
- [ ] Works with recent Copilot CLI versions
- [ ] Doesn't break existing agents

## Quality Gates

Before marking complete, ALL of the following must be true:

- [ ] **Code Quality**: No linting errors, TypeScript compiles clean
- [ ] **Test Coverage**: >80% coverage, all tests passing
- [ ] **Documentation**: Complete and accurate
- [ ] **Functionality**: All features working as designed
- [ ] **Manual Testing**: Comprehensive testing completed
- [ ] **Regression**: No breakage of existing functionality

## Sign-Off

- [ ] Developer: Verified all checks complete
- [ ] Code Review: Changes reviewed and approved (if applicable)
- [ ] Testing: QA testing completed (if applicable)
- [ ] Documentation: Documentation is complete and accurate

## Common Issues During Testing

| Issue | Resolution |
|-------|-----------|
| Tests fail to find Copilot binary | Mock binary path in tests or ensure installed |
| E2E tests timeout | Increase timeout, check system performance |
| Memory leak in tests | Check for unclosed file handles or connections |
| Documentation conflicts | Verify against actual implementation |

## Post-Release

After release:

- [ ] Monitor for bug reports related to Copilot integration
- [ ] Respond to user issues and questions
- [ ] Collect feedback for improvements
- [ ] Plan follow-up features (e.g., image support)
- [ ] Track Copilot CLI updates and compatibility

## Notes

**Testing Requirements:**
- Unit tests should run in <5 seconds
- Integration tests should run in <30 seconds
- E2E tests should run in <2 minutes
- Manual testing should be completed before release

**Documentation Standards:**
- Clear and concise
- Includes examples where appropriate
- Links to external resources
- Covers both happy path and error cases
- Updated for each release

## Next Steps

Once Phase 7 is complete:
1. All code is ready for merge
2. All tests are passing
3. Documentation is complete
4. Ready for release
