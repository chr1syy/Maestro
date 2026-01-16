# Gemini Rate Limit Fallback Implementation

## Overview

This document describes how to implement automatic fallback model switching when Gemini hits rate limits.

## Current Status

✅ **Completed:**
- Added Gemini error patterns to `error-patterns.ts` for detecting rate limits
- Added `fallbackModel` configuration option in agent-detector.ts
- Error patterns now detect rate limit errors and mark them as recoverable

❌ **Remaining Work:**

The automatic retry with fallback model requires implementing retry logic at the IPC handler level. This is a more complex change that needs careful integration with the existing process management system.

## Implementation Strategy

### 1. Error Detection (✅ Complete)

The error patterns in `src/main/parsers/error-patterns.ts` now include:
- Rate limit detection (HTTP 429, "rate limit", "quota exceeded")
- Resource exhaustion detection ("resource exhausted")
- All errors marked as `recoverable: true` for retry capability

### 2. Fallback Model Configuration (✅ Complete)

In `src/main/agent-detector.ts`, the Gemini agent now has:
```typescript
{
  key: 'fallbackModel',
  type: 'text',
  label: 'Fallback Model',
  description: 'Fallback model to use if the primary model is unavailable (e.g., due to rate limits).',
  default: 'gemini-1.5-pro',
}
```

### 3. Retry Logic (❌ To Be Implemented)

The retry logic needs to be implemented in the IPC handler that spawns agents (likely `src/main/ipc/handlers/process.ts`). Here's the suggested approach:

```typescript
// Pseudocode for implementation location
async function handleAgentQuery(params) {
  let retryCount = 0;
  const maxRetries = 1; // Try fallback once
  
  while (retryCount <= maxRetries) {
    try {
      // Spawn agent with current model
      const result = await spawnAgent(params);
      return result;
    } catch (error) {
      // Check if error is rate_limited and recoverable
      if (error.type === 'rate_limited' && error.recoverable && retryCount < maxRetries) {
        // Get fallback model from agent config
        const fallbackModel = agentConfigValues['fallbackModel'];
        
        if (fallbackModel && fallbackModel !== params.model) {
          logger.info(`Rate limit hit, retrying with fallback model: ${fallbackModel}`);
          
          // Update params to use fallback model
          params.model = fallbackModel;
          retryCount++;
          
          // Optional: Emit a message to user about the fallback
          safeSend('agent:message', sessionId, {
            type: 'fallback',
            message: `Rate limit reached. Switching to fallback model: ${fallbackModel}`
          });
          
          continue; // Retry with fallback model
        }
      }
      
      // Either not rate limited, not recoverable, or no fallback configured
      throw error;
    }
  }
}
```

### 4. Integration Points

The implementation needs to touch these files:

1. **`src/main/ipc/handlers/process.ts`** - Add retry logic around agent spawning
2. **`src/main/process-manager.ts`** - May need to propagate error type info
3. **`src/renderer/stores/session.ts`** - Handle fallback notifications in UI

### 5. User Experience

When a rate limit is hit:
1. User sees a notification: "Rate limit reached. Switching to fallback model: gemini-1.5-pro"
2. The query automatically retries with the fallback model
3. If fallback also fails, the error is shown normally

## Testing

To test the implementation:
1. Configure primary model: `gemini-2.0-flash-exp` (or another high-rate model)
2. Configure fallback model: `gemini-1.5-flash`
3. Trigger rate limits by making many requests
4. Verify automatic fallback occurs
5. Check logs for retry messages

## Configuration

Users can configure the fallback model in:
- **Agent Settings UI**: Go to Settings → Agents → Gemini CLI → Fallback Model
- **Session Level**: Override via session settings if needed

## Notes

- The fallback only triggers once per query (no cascading fallbacks)
- Rate limit errors are marked as `recoverable: true` to enable retry
- Other errors (auth, network) do not trigger fallback
- If no fallback model is configured, behavior is unchanged (error shown to user)

