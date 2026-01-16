# Phase 4: CLI Spawner Integration

Integrate Copilot CLI detection and spawning into the CLI/Electron process management system.

## Prerequisites

- [ ] Phase 1: Research & Setup completed
- [ ] Phase 2: Core Agent Definition completed
- [ ] Phase 3: Output Parser completed and tested

## Implementation Tasks

### 4.1 Add Copilot Detection

**File:** `src/main/agent-detector.ts`

This file already detects available agents on the system. Copilot detection should already work through the standard binary detection, but we may need to enhance it.

- [ ] Verify that Copilot CLI detection works in existing system
  - Check how `detectAgentsOnSystem()` or similar function works
  - Ensure Copilot binary is being found in PATH

**Task:** Verify Copilot is detected
```bash
npm run dev
# In Settings > Agents, verify "GitHub Copilot CLI" appears
# Should show as "available" if copilot binary is in PATH
```

- [ ] If not detected, add custom detection logic if needed
  ```typescript
  // In src/main/agent-detector.ts if needed:
  // Special handling for copilot if gh extension needs special detection
  ```

### 4.2 Update Process Manager

**File:** `src/main/process-manager.ts`

Verify that Copilot CLI is properly spawned. The process manager should handle it like other CLI agents.

- [ ] Check that `ProcessConfig` type includes all needed fields for Copilot
  - [ ] `jsonOutputArgs` support (should already exist)
  - [ ] `batchModePrefix` support (should already exist)
  - [ ] `promptArgs` support (should already exist)

- [ ] Verify spawning logic handles Copilot's output format
  - [ ] JSON parsing works correctly
  - [ ] Stream-based output is handled
  - [ ] Errors are properly caught

**Task:** Review relevant sections of process-manager.ts
```typescript
// These should already be in place:
// 1. JSON output argument handling
// 2. Batch mode prefix handling
// 3. Output parser selection
// 4. Error detection and propagation
```

No changes needed if existing process manager is generic enough.

### 4.3 Add Copilot to Agent Spawner (CLI)

**File:** `src/cli/services/agent-spawner.ts`

The CLI spawner needs to know how to launch Copilot.

- [ ] Locate `spawnAgent()` or equivalent function
- [ ] Add Copilot case handler

**Task:** Add Copilot spawning support
```typescript
// In src/cli/services/agent-spawner.ts

// Add to spawnAgent function's switch/if statement:
case 'copilot-cli': {
  const copilotAgent = getAgent('copilot-cli');
  if (!copilotAgent?.path) {
    throw new Error('Copilot CLI not found. Install via: gh extension install github/gh-copilot');
  }
  
  const args = buildCopilotArgs(copilotAgent, {
    cwd,
    prompt,
    agentSessionId,
  });
  
  return spawnCopilotAgent(copilotAgent.path, args, cwd);
}

// Helper function:
function buildCopilotArgs(
  agent: AgentConfig,
  options: {
    cwd: string;
    prompt: string;
    agentSessionId?: string;
  }
): string[] {
  // Use existing buildAgentArgs utility
  return buildAgentArgs(agent, {
    baseArgs: agent.args,
    prompt: options.prompt,
    cwd: options.cwd,
    agentSessionId: options.agentSessionId,
  });
}

// Spawn function:
async function spawnCopilotAgent(
  binaryPath: string,
  args: string[],
  cwd: string
): Promise<AgentResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    
    let jsonBuffer = '';
    let textBuffer = '';
    
    child.stdout!.on('data', (data: Buffer) => {
      const text = data.toString();
      jsonBuffer += text;
      
      // Try to parse complete JSON lines
      const lines = jsonBuffer.split('\n');
      jsonBuffer = lines[lines.length - 1]; // Keep incomplete line
      
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.content || parsed.message) {
              textBuffer += (parsed.content || parsed.message);
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: textBuffer });
      } else {
        reject(new Error(`Copilot exited with code ${code}`));
      }
    });
    
    child.on('error', reject);
    
    // Send prompt via stdin if needed
    if (child.stdin) {
      child.stdin.write(args.join(' '));
      child.stdin.end();
    }
  });
}
```

### 4.4 Update IPC Handlers

**File:** `src/main/ipc/handlers/process.ts`

The IPC handler that spawns processes may need updates for Copilot.

- [ ] Locate the handler for spawning agent processes
  - [ ] Find where `processManager.spawn()` is called
  - [ ] Verify Copilot is handled with correct arguments

- [ ] Check if model selection is passed correctly
  - [ ] User-configured model is passed to Copilot
  - [ ] Fallback models are handled (if needed)

**Task:** Verify process spawning
```typescript
// In src/main/ipc/handlers/process.ts

// The handler should already support dynamic agents
// Verify it calls buildAgentArgs with correct config overrides
// which will apply model selection and other flags
```

### 4.5 Add Copilot to Agent-Related IPC Handlers

**File:** `src/main/ipc/handlers/agents.ts`

- [ ] Verify `listAgents()` includes Copilot
- [ ] Verify `getAgent()` works for Copilot
- [ ] Verify agent configuration is returned correctly

**Task:** Test agent lookup
```bash
npm run dev
# Open DevTools and run:
# ipcRenderer.invoke('agents:list')
# Should include { id: 'copilot-cli', ... }
```

### 4.6 Verify Integration with Electron Main Process

**File:** `src/main/index.ts`

- [ ] Check that Copilot error detection works
- [ ] Verify error messages are properly formatted
- [ ] Ensure rate limiting (if applicable) triggers correct behavior

**Task:** Review error handling
```typescript
// In src/main/index.ts

// Check that:
// 1. Agent error handler processes Copilot errors
// 2. Error patterns match Copilot error format
// 3. Recovery suggestions are appropriate
```

## Testing Tasks

### 4.1 Unit Tests

**File:** `src/__tests__/main/ipc/handlers/process.test.ts` or similar

- [ ] Create test for spawning Copilot agent
- [ ] Verify arguments are built correctly
- [ ] Test with different model selections
- [ ] Test error scenarios

**Task:** Add spawn test
```typescript
// Add to existing process handler tests:

describe('Copilot CLI spawning', () => {
  it('should build correct arguments for Copilot', () => {
    const agent = getAgent('copilot-cli');
    const args = buildAgentArgs(agent!, {
      baseArgs: agent!.args,
      prompt: 'What is 2+2?',
    });
    
    expect(args).toContain('chat'); // or appropriate subcommand
    expect(args).toContain('--output-format');
    expect(args).toContain('stream-json');
  });
  
  it('should apply model selection', () => {
    const agent = getAgent('copilot-cli');
    const args = applyAgentConfigOverrides(agent!, agent!.args, {
      agentConfigValues: { model: 'gpt-4' }
    });
    
    expect(args).toContain('--model');
    expect(args).toContain('gpt-4');
  });
});
```

### 4.2 Integration Tests

**File:** `src/__tests__/integration/agent-spawning.test.ts` or similar

- [ ] Test actual spawning of Copilot agent (if available on test system)
- [ ] Verify output parsing works end-to-end
- [ ] Test with different prompts
- [ ] Verify session handling (if supported)

**Task:** Create integration test
```typescript
// Create: src/__tests__/integration/copilot-spawn.test.ts

describe('Copilot CLI Integration', () => {
  it('should spawn Copilot and parse output', async () => {
    const agent = getAgent('copilot-cli');
    if (!agent?.available) {
      skip('Copilot CLI not installed');
    }
    
    const result = await spawnCopilotAgent(
      agent.path!,
      ['chat', '--format', 'json'],
      process.cwd()
    );
    
    expect(result.success).toBe(true);
    expect(result.output.length).toBeGreaterThan(0);
  });
});
```

### 4.3 Manual Testing

**End-to-End Test:**

- [ ] Start Maestro application
  ```bash
  npm run dev
  ```

- [ ] Go to Settings > Agents
  - [ ] Verify GitHub Copilot CLI is listed
  - [ ] Check if marked as "available"
  - [ ] Model selection option is visible

- [ ] Create new session with Copilot CLI
  - [ ] Select GitHub Copilot CLI from agent dropdown
  - [ ] Enter a test prompt (e.g., "Explain recursion")
  - [ ] Submit and wait for response

- [ ] Verify output
  - [ ] Response is displayed correctly
  - [ ] Text is formatted properly
  - [ ] No parsing errors in console
  - [ ] Session is created and saved

- [ ] Test model selection
  - [ ] Change model in agent settings
  - [ ] Send another query
  - [ ] Verify correct model flag is passed

## Verification Checklist

### Code Quality
- [ ] No TypeScript errors
- [ ] Imports are correct
- [ ] Error handling is comprehensive
- [ ] Logging is in place for debugging

### Functionality
- [ ] Copilot agent is detected on system
- [ ] Agent can be selected in UI
- [ ] Arguments are built correctly
- [ ] Output is parsed correctly
- [ ] Model selection works
- [ ] Sessions are created properly
- [ ] Errors are handled gracefully

### Integration
- [ ] IPC handlers work correctly
- [ ] Process manager spawns Copilot properly
- [ ] Output parser receives data
- [ ] Events are emitted correctly
- [ ] UI displays results

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual E2E testing successful
- [ ] No errors in browser console
- [ ] No errors in main process logs

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Copilot not found" | Ensure gh CLI and copilot extension installed |
| "Output parsing fails" | Verify JSON structure matches output parser expectations |
| "Arguments not passed correctly" | Check buildAgentArgs implementation |
| "Model selection not working" | Verify argBuilder in configOptions is correct |
| "Process hangs on stdin" | Check if Copilot expects input differently |

## Notes

**Dependencies:**
- GitHub `gh` CLI and `copilot` extension must be installed
- Copilot must be in system PATH or configured path
- GitHub authentication must be set up

**Potential Issues:**
- Copilot's stdin handling might differ from other agents
- Output format might not perfectly match expected schema
- Model selection flags might use different names

## Next Steps

Once Phase 4 is complete and tested:
1. Proceed to Phase 5: Session Storage (if needed)
2. Or skip to Phase 6: UI Integration
3. Consider Phase 7: Testing & Documentation
