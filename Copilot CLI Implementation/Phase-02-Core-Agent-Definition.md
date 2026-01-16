# Phase 2: Core Agent Definition

Implement the basic agent definition and capabilities for Copilot CLI.

## Prerequisites

- [ ] Phase 1: Research & Setup completed
- [ ] Investigation results available in `Copilot CLI Investigation Results.md`

## Implementation Tasks

### 2.1 Add Copilot Agent Definition

**File:** `src/main/agent-detector.ts`

- [ ] Locate the `AGENT_DEFINITIONS` array
- [ ] Add new Copilot agent definition after existing agents

**Based on Phase 1 findings:**
- [ ] Update `binaryName` to match actual Copilot CLI binary name (if different from `copilot`)
- [ ] Update `command` to match executable path
- [ ] Set `batchModePrefix` based on discovered subcommand structure
- [ ] Set `batchModeArgs` with appropriate flags
- [ ] Set `jsonOutputArgs` with correct JSON output flag
- [ ] Set `promptArgs` based on how Copilot accepts input
- [ ] Set `resumeArgs` if sessions are supported
- [ ] Set `readOnlyArgs` if plan/explain mode is available
- [ ] Configure `configOptions` for model selection

**Task:** Add agent definition
```typescript
// Add to AGENT_DEFINITIONS array in src/main/agent-detector.ts
{
  id: 'copilot-cli',
  name: 'GitHub Copilot CLI',
  binaryName: 'copilot',  // UPDATE based on Phase 1
  command: 'copilot',     // UPDATE based on Phase 1
  args: [],
  // ... other fields based on Phase 1 findings
}
```

### 2.2 Define Agent Capabilities

**File:** `src/main/agent-capabilities.ts`

- [ ] Locate the `AGENT_CAPABILITIES` object
- [ ] Add new entry for `copilot-cli`

**Based on Phase 1 findings, determine TRUE/FALSE for:**
- [ ] `supportsResume` - can sessions be resumed?
- [ ] `supportsReadOnlyMode` - is there a plan/explain mode?
- [ ] `supportsJsonOutput` - confirmed in Phase 1
- [ ] `supportsSessionId` - does it emit session IDs?
- [ ] `supportsImageInput` - can images be attached?
- [ ] `supportsModelSelection` - can models be selected?
- [ ] `supportsBatchMode` - confirmed (CLI-based)
- [ ] `supportsStreaming` - based on Phase 1 output format
- [ ] All other capabilities (see template)

**Task:** Add capabilities definition
```typescript
// Add to AGENT_CAPABILITIES in src/main/agent-capabilities.ts
'copilot-cli': {
  supportsResume: false,        // UPDATE based on Phase 1
  supportsReadOnlyMode: false,  // UPDATE based on Phase 1
  // ... other fields
}
```

### 2.3 Update VALID_TOOL_TYPES Set

**File:** `src/main/parsers/error-patterns.ts`

- [ ] Locate `VALID_TOOL_TYPES` set (around line 26)
- [ ] Add `'copilot-cli'` to the set

**Task:** Add to validation set
```typescript
const VALID_TOOL_TYPES = new Set<string>([
  'claude', 
  'claude-code', 
  'aider', 
  'opencode', 
  'codex', 
  'gemini-cli', 
  'terminal',
  'copilot-cli'  // ADD THIS LINE
]);
```

### 2.4 Add Copilot Error Patterns (Optional)

**File:** `src/main/parsers/error-patterns.ts`

Only if Copilot has unique error messages not covered by generic patterns:

- [ ] Create `COPILOT_ERROR_PATTERNS` constant
- [ ] Add patterns for common Copilot errors:
  - [ ] Authentication errors
  - [ ] Rate limiting
  - [ ] Network errors
  - [ ] Invalid input
  - [ ] Session expired (if applicable)

**Task:** Create error patterns (optional)
```typescript
// Add before SSH_ERROR_PATTERNS in src/main/parsers/error-patterns.ts
export const COPILOT_ERROR_PATTERNS: AgentErrorPatterns = {
  auth_expired: [
    // ... patterns for auth errors
  ],
  rate_limited: [
    // ... patterns for rate limits
  ],
  // ... other error types
};
```

### 2.5 Register Error Patterns

**File:** `src/main/parsers/error-patterns.ts`

If error patterns were created in 2.4:

- [ ] Locate `patternRegistry` (around line 800+)
- [ ] Add entry for `copilot-cli`

**Task:** Register patterns
```typescript
const patternRegistry = new Map<ToolType, AgentErrorPatterns>([
  // ... existing entries
  ['copilot-cli', COPILOT_ERROR_PATTERNS],  // ADD THIS LINE
]);
```

### 2.6 Verify Agent Detection

**File:** `src/main/agent-detector.ts` (review section)

- [ ] Ensure agent definition follows same pattern as existing agents
- [ ] Verify all required fields are present
- [ ] Check for TypeScript compilation errors

**Task:** Compile and check
```bash
npm run build
```
- [ ] No TypeScript errors in agent-detector.ts
- [ ] No errors in agent-capabilities.ts
- [ ] No errors in error-patterns.ts

## Verification Checklist

### Code Verification
- [ ] Agent definition added to AGENT_DEFINITIONS
- [ ] All required fields populated based on Phase 1 findings
- [ ] Capabilities defined in AGENT_CAPABILITIES
- [ ] Tool type added to VALID_TOOL_TYPES
- [ ] Error patterns registered (if created)
- [ ] TypeScript compiles without errors

### Testing Agent Detection
```bash
npm run build
```
Then in a test file (temporary):
```typescript
import { AGENT_DEFINITIONS } from './agent-detector';
const copilotAgent = AGENT_DEFINITIONS.find(a => a.id === 'copilot-cli');
console.log('Copilot agent found:', !!copilotAgent);
console.log('Agent config:', copilotAgent);
```

- [ ] Agent is detected
- [ ] All fields are populated
- [ ] No undefined or missing fields

## Testing

### Unit Test (if applicable)
- [ ] Agent appears in agent list
- [ ] Capabilities are correctly returned
- [ ] Configuration options are accessible

### Manual Check
```bash
# Run the app and check Settings > Agents
# - GitHub Copilot CLI should appear in the list
# - Configuration options should be visible
```

- [ ] Copilot CLI shows in agents list
- [ ] Model selection option visible (if applicable)
- [ ] All configured fields are displayed

## Notes

**Dependencies from Phase 1:**
- Copilot CLI must be installed on system
- GitHub authentication must be set up
- All command-line flags must match Copilot's actual interface

**Common Issues:**
- Typos in `binaryName` will cause agent to report as unavailable
- Missing fields will cause TypeScript errors
- Incorrect capabilities flags may lead to feature requests for unavailable functionality

## Next Steps

Once Phase 2 is complete and verified:
1. Proceed to Phase 3: Output Parser
2. Output parser will use the command structure defined here
3. Testing will become more comprehensive
