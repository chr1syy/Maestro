# Phase 5: Session Storage

Implement persistent session storage for Copilot CLI (if supported).

## Prerequisites

- [ ] Phase 1: Research & Setup completed
- [ ] Phase 2: Core Agent Definition completed
- [ ] Phase 3: Output Parser completed
- [ ] Phase 4: CLI Spawner Integration completed
- [ ] **Phase 1 Finding:** Sessions are confirmed to be supported by Copilot CLI

> ⚠️ **CONDITIONAL PHASE**: Only proceed if Phase 1 research determined that Copilot CLI supports persistent sessions. If not, mark all tasks as SKIPPED and move to Phase 6.

## Decision Point

**⚠️ USER DECISION REQUIRED**

Before proceeding, confirm:
- [ ] Does Copilot CLI support persistent sessions? (Yes/No from Phase 1)
  - [ ] If **NO**: Skip this entire phase and proceed to Phase 6
  - [ ] If **YES**: Proceed with implementation below

## Implementation Tasks (Only if sessions are supported)

### 5.1 Analyze Existing Session Storage Pattern

**File:** `src/main/storage/` directory

- [ ] Review existing session storage implementations
  - [ ] `claude-session-storage.ts` (if exists)
  - [ ] `codex-session-storage.ts` (if exists)
  - [ ] Generic `session-storage.ts` interface

- [ ] Understand session storage interface
  - [ ] What methods are required?
  - [ ] How are sessions persisted?
  - [ ] What data is stored per session?

**Task:** Document session storage pattern
- [ ] List all required methods
- [ ] Understand data structure
- [ ] Check where sessions are stored on disk

### 5.2 Create Copilot Session Storage

**File:** `src/main/storage/copilot-session-storage.ts`

Based on Phase 1 findings about Copilot session format:

- [ ] Create new file implementing session storage interface
- [ ] Implement session persistence
  - [ ] Save session IDs when created
  - [ ] Retrieve sessions when resuming
  - [ ] Delete expired sessions
  - [ ] List available sessions

**Task:** Create session storage class
```typescript
// Create: src/main/storage/copilot-session-storage.ts

import type { AgentSessionStorage, SessionInfo } from './types';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * GitHub Copilot CLI Session Storage
 * 
 * Handles persistence of Copilot conversation sessions
 */
export class CopilotSessionStorage implements AgentSessionStorage {
  private storagePath: string;

  constructor(storagePath: string) {
    this.storagePath = storagePath;
  }

  /**
   * Save a new session
   * sessionId format determined in Phase 1
   */
  async saveSession(sessionId: string, metadata?: Record<string, any>): Promise<void> {
    const sessionFile = path.join(this.storagePath, `copilot-session-${sessionId}.json`);
    
    const sessionData = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      metadata: metadata || {},
    };
    
    await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));
    logger.debug(`Saved Copilot session: ${sessionId}`);
  }

  /**
   * Get session info
   */
  async getSession(sessionId: string): Promise<SessionInfo | null> {
    const sessionFile = path.join(this.storagePath, `copilot-session-${sessionId}.json`);
    
    try {
      const data = await fs.readFile(sessionFile, 'utf-8');
      const sessionData = JSON.parse(data);
      return {
        id: sessionData.id,
        createdAt: sessionData.createdAt,
        lastAccessedAt: sessionData.lastAccessedAt,
      };
    } catch {
      return null;
    }
  }

  /**
   * List all available sessions
   */
  async listSessions(): Promise<SessionInfo[]> {
    try {
      const files = await fs.readdir(this.storagePath);
      const sessions: SessionInfo[] = [];
      
      for (const file of files) {
        if (file.startsWith('copilot-session-')) {
          const data = await fs.readFile(
            path.join(this.storagePath, file),
            'utf-8'
          );
          const sessionData = JSON.parse(data);
          sessions.push({
            id: sessionData.id,
            createdAt: sessionData.createdAt,
            lastAccessedAt: sessionData.lastAccessedAt,
          });
        }
      }
      
      return sessions;
    } catch (error) {
      logger.warn(`Failed to list Copilot sessions: ${error}`);
      return [];
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const sessionFile = path.join(this.storagePath, `copilot-session-${sessionId}.json`);
    
    try {
      await fs.unlink(sessionFile);
      logger.debug(`Deleted Copilot session: ${sessionId}`);
    } catch (error) {
      logger.warn(`Failed to delete Copilot session: ${error}`);
    }
  }

  /**
   * Update last accessed time
   */
  async updateLastAccessed(sessionId: string): Promise<void> {
    const sessionFile = path.join(this.storagePath, `copilot-session-${sessionId}.json`);
    
    try {
      const data = await fs.readFile(sessionFile, 'utf-8');
      const sessionData = JSON.parse(data);
      sessionData.lastAccessedAt = new Date().toISOString();
      await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));
    } catch (error) {
      logger.warn(`Failed to update Copilot session: ${error}`);
    }
  }
}
```

### 5.3 Register Session Storage

**File:** Session storage registry (if exists)

- [ ] Locate where session storages are registered
- [ ] Add Copilot session storage to registry
- [ ] Ensure factory function creates CopilotSessionStorage when needed

**Task:** Register in factory
```typescript
// In session storage factory/registry:

import { CopilotSessionStorage } from './copilot-session-storage';

export function createSessionStorage(agentId: string, storagePath: string) {
  switch (agentId) {
    case 'copilot-cli':
      return new CopilotSessionStorage(storagePath);
    // ... other agents
  }
}
```

### 5.4 Integrate Session Handling in Process Manager

**File:** `src/main/process-manager.ts`

- [ ] Verify session ID is captured from Copilot output
- [ ] Save session ID when new session is created
- [ ] Load session ID when resuming
- [ ] Pass session ID to Copilot via resumeArgs

**Task:** Verify session integration
```typescript
// In process-manager.ts, when handling Copilot output:

// Capture session ID from parsed events
if (event.sessionId && !processInfo.sessionIdEmitted) {
  sessionStorage.saveSession(event.sessionId);
  safeSend('session-id', sessionId, event.sessionId);
  processInfo.sessionIdEmitted = true;
}

// When resuming session, pass session ID
const resumeArgs = agent.resumeArgs?.(agentSessionId) || [];
// Should result in: ['--session', sessionId]
```

### 5.5 Integrate in IPC Handlers

**File:** `src/main/ipc/handlers/process.ts`

- [ ] Verify session ID is returned to renderer
- [ ] Support session resumption from UI
- [ ] Handle session listing

**Task:** Verify IPC handler support
```typescript
// In process handler:

// Return session ID in response
const sessionId = await processManager.spawn({
  // ... config
  agentSessionId: params.resumeSessionId, // If resuming
});

// Session should be available for resumption in UI
```

## Testing Tasks

### 5.1 Unit Tests

**File:** `src/__tests__/main/storage/copilot-session-storage.test.ts`

- [ ] Test session saving
- [ ] Test session retrieval
- [ ] Test session listing
- [ ] Test session deletion
- [ ] Test file cleanup

**Task:** Create session storage tests
```typescript
// Create: src/__tests__/main/storage/copilot-session-storage.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CopilotSessionStorage } from '../../../main/storage/copilot-session-storage';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('CopilotSessionStorage', () => {
  let tempDir: string;
  let storage: CopilotSessionStorage;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `copilot-storage-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    storage = new CopilotSessionStorage(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should save and retrieve session', async () => {
    const sessionId = 'test-session-123';
    await storage.saveSession(sessionId);
    
    const session = await storage.getSession(sessionId);
    expect(session).toBeDefined();
    expect(session?.id).toBe(sessionId);
  });

  it('should list all sessions', async () => {
    await storage.saveSession('session-1');
    await storage.saveSession('session-2');
    
    const sessions = await storage.listSessions();
    expect(sessions.length).toBe(2);
  });

  it('should delete session', async () => {
    const sessionId = 'test-session-123';
    await storage.saveSession(sessionId);
    await storage.deleteSession(sessionId);
    
    const session = await storage.getSession(sessionId);
    expect(session).toBeNull();
  });
});
```

### 5.2 Integration Tests

- [ ] Test session persistence across app restarts
- [ ] Test resuming Copilot conversation with saved session
- [ ] Test session cleanup/expiration (if applicable)

**Task:** Create integration test
```typescript
// In existing integration test file:

describe('Copilot Session Persistence', () => {
  it('should resume conversation with saved session', async () => {
    // 1. Spawn Copilot with prompt
    // 2. Capture session ID
    // 3. Close session
    // 4. Resume with saved session ID
    // 5. Verify conversation continues
  });
});
```

### 5.3 Manual Testing

- [ ] Start Maestro and create session with Copilot
  - [ ] Note the session ID in logs
  - [ ] Send a message and verify response

- [ ] Check that session is persisted
  - [ ] Restart Maestro
  - [ ] Session should still be available for resumption
  - [ ] Click "Resume" or similar option
  - [ ] Conversation should continue with same context

- [ ] Test session listing
  - [ ] Multiple sessions should be visible in UI
  - [ ] Each session should have correct metadata
  - [ ] Can switch between sessions

## Verification Checklist

### Code Quality
- [ ] No TypeScript errors
- [ ] Follows existing storage pattern
- [ ] Error handling is comprehensive
- [ ] Logging for debugging

### Functionality
- [ ] Session ID captured from Copilot
- [ ] Sessions are saved to disk
- [ ] Sessions can be retrieved
- [ ] Sessions can be listed
- [ ] Sessions can be deleted
- [ ] Resume functionality works
- [ ] Conversation context is preserved on resume

### Integration
- [ ] IPC handlers work with sessions
- [ ] Session ID is emitted to renderer
- [ ] UI can display available sessions
- [ ] Resume session functionality works
- [ ] Session cleanup happens properly

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass (if created)
- [ ] Manual E2E testing successful

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Session not found on resume" | Verify session ID format matches Copilot's output |
| "Session file corruption" | Add validation and error handling for malformed files |
| "Sessions not persisting" | Check storage path exists and is writable |
| "Old sessions accumulate" | Implement expiration/cleanup logic |

## Skip Criteria

If Phase 1 determined that Copilot CLI does NOT support sessions:

- [ ] Mark this entire phase as SKIPPED
- [ ] Remove `supportsSessionStorage` from capabilities (keep as `false`)
- [ ] Remove `supportsResume` from capabilities (keep as `false`)
- [ ] Remove session-related code from process manager
- [ ] Proceed to Phase 6 without session handling

## Notes

**Dependencies:**
- Session format must match Copilot's output structure
- Storage path must be configured in app settings
- Disk I/O must be async to prevent blocking

**Potential Issues:**
- Session IDs might not be unique per-run
- Copilot might not support resumption
- Session format might change between Copilot versions

## Next Steps

Once Phase 5 is complete (or skipped):
1. Proceed to Phase 6: UI Integration
2. UI will need to display session options
3. Session list will be shown in session settings
