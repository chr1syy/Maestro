# Phase 3: Output Parser

Implement the output parser for Copilot CLI JSON output.

## Prerequisites

- [ ] Phase 1: Research & Setup completed
- [ ] Phase 2: Core Agent Definition completed
- [ ] JSON output format documented in `Copilot CLI Investigation Results.md`

## Implementation Tasks

### 3.1 Create Output Parser File

**File:** `src/main/parsers/copilot-output-parser.ts`

- [ ] Create new file in `src/main/parsers/`
- [ ] Import required types from `agent-output-parser.ts`
- [ ] Implement `CopilotOutputParser` class extending `AgentOutputParser`

**Task:** Create basic parser structure
```typescript
// Create: src/main/parsers/copilot-output-parser.ts

import type { ParsedEvent } from './agent-output-parser';
import { AgentOutputParser } from './agent-output-parser';
import { logger } from '../utils/logger';

/**
 * GitHub Copilot CLI Output Parser
 * 
 * Transforms Copilot's JSON/JSONL output into normalized ParsedEvent format.
 */
export class CopilotOutputParser implements AgentOutputParser {
  parseJsonLine(line: string): ParsedEvent | null {
    // Implementation based on Phase 1 findings
  }

  extractSlashCommands(_event: ParsedEvent): string[] | null {
    return null;
  }
}
```

### 3.2 Implement parseJsonLine Method

**Based on Phase 1 JSON output structure:**

- [ ] Determine Copilot's event type field name
- [ ] Map Copilot event types to ParsedEvent types:
  - [ ] Text/message events → `type: 'text'`
  - [ ] Complete/done events → `type: 'result'`
  - [ ] Error events → `type: 'error'`
  - [ ] Session/init events → `type: 'init'`
  - [ ] Any other types → map appropriately

- [ ] Extract text content from Copilot's message field
- [ ] Determine session ID field (if present)
- [ ] Handle usage/cost information (if present)
- [ ] Set `raw` field to original JSON object

**Task:** Implement parseJsonLine
```typescript
parseJsonLine(line: string): ParsedEvent | null {
  if (!line.trim()) {
    return null;
  }

  try {
    const obj = JSON.parse(line);
    
    // Based on Phase 1 findings, map Copilot's event format
    // Example structure (UPDATE based on actual findings):
    // {
    //   "type": "message" | "complete" | "error",
    //   "content": "...",
    //   "session_id": "...",
    //   "usage": { ... }
    // }

    // Map event type
    let eventType: ParsedEvent['type'] = 'text';
    if (obj.type === 'complete') {
      eventType = 'result';
    } else if (obj.type === 'error') {
      eventType = 'error';
    }

    return {
      type: eventType,
      text: obj.content || obj.message || '',
      sessionId: obj.session_id || obj.sessionId,
      raw: obj,
    };
  } catch (error) {
    logger.warn(`Failed to parse Copilot output: ${error}`, 'CopilotOutputParser', { line: line.substring(0, 100) });
    return null;
  }
}
```

### 3.3 Handle Special Cases

Based on Phase 1 findings, implement handling for:

- [ ] **Streaming chunks** - if output is chunked, reassemble properly
- [ ] **Empty responses** - handle gracefully
- [ ] **Malformed JSON** - log and skip
- [ ] **Session IDs** - extract and propagate if present
- [ ] **Usage information** - extract if available
- [ ] **Error details** - capture error codes/messages

**Task:** Add helper methods as needed
```typescript
// Add these methods to CopilotOutputParser if needed based on Phase 1:

private extractSessionId(obj: any): string | undefined {
  // Implementation based on Copilot's session ID field name
  return obj.session_id || obj.sessionId || undefined;
}

private extractUsage(obj: any): any | undefined {
  // Extract usage/cost if Copilot provides it
  return obj.usage || obj.metrics || undefined;
}

private mapEventType(copilotType: string): ParsedEvent['type'] {
  // Map Copilot's event types to standard ParsedEvent types
  const typeMap: Record<string, ParsedEvent['type']> = {
    'message': 'text',
    'text': 'text',
    'complete': 'result',
    'done': 'result',
    'error': 'error',
    'init': 'init',
    'session': 'init',
  };
  return typeMap[copilotType] || 'text';
}
```

### 3.4 Register Parser in Index

**File:** `src/main/parsers/index.ts`

- [ ] Import `CopilotOutputParser`
- [ ] Add to parser registration in `initializeOutputParsers()` or wherever parsers are registered
- [ ] Map `'copilot-cli'` to `new CopilotOutputParser()`

**Task:** Register parser
```typescript
// In src/main/parsers/index.ts

import { CopilotOutputParser } from './copilot-output-parser';

// In the initialization or registry:
// If using a Map:
parserRegistry.set('copilot-cli', new CopilotOutputParser());

// Or in a switch/if chain:
case 'copilot-cli':
  return new CopilotOutputParser();
```

### 3.5 Add to getOutputParser Export

**File:** `src/main/parsers/index.ts`

- [ ] Ensure `getOutputParser('copilot-cli')` returns CopilotOutputParser instance
- [ ] Verify export is available to consumers

**Task:** Verify export
```typescript
// In getOutputParser or equivalent function:
export function getOutputParser(agentId: ToolType | string): AgentOutputParser | null {
  // ... existing code ...
  if (agentId === 'copilot-cli') {
    return new CopilotOutputParser();
  }
  // ... rest of code ...
}
```

## Testing Tasks

### 3.1 Unit Tests

**File:** `src/__tests__/main/parsers/copilot-output-parser.test.ts`

- [ ] Create test file
- [ ] Write tests for JSON parsing

**Task:** Create basic test structure
```typescript
// Create: src/__tests__/main/parsers/copilot-output-parser.test.ts

import { describe, it, expect } from 'vitest';
import { CopilotOutputParser } from '../../../main/parsers/copilot-output-parser';

describe('CopilotOutputParser', () => {
  const parser = new CopilotOutputParser();

  it('should parse text event', () => {
    const input = JSON.stringify({
      type: 'message',
      content: 'Hello from Copilot',
      session_id: 'session-123'
    });
    
    const result = parser.parseJsonLine(input);
    expect(result).toBeDefined();
    expect(result?.type).toBe('text');
    expect(result?.text).toBe('Hello from Copilot');
  });

  it('should parse completion event', () => {
    const input = JSON.stringify({
      type: 'complete',
      content: 'Done',
      session_id: 'session-123'
    });
    
    const result = parser.parseJsonLine(input);
    expect(result?.type).toBe('result');
  });

  it('should handle empty lines', () => {
    const result = parser.parseJsonLine('');
    expect(result).toBeNull();
  });

  it('should handle malformed JSON', () => {
    const result = parser.parseJsonLine('not json');
    expect(result).toBeNull();
  });

  // Additional tests based on Phase 1 findings
  // - Test error event parsing
  // - Test session ID extraction
  // - Test usage information extraction
  // - Test edge cases
});
```

### 3.2 Manual Testing

- [ ] Run TypeScript compilation to check for errors
  ```bash
  npm run build
  ```
  
- [ ] Run parser tests
  ```bash
  npm run test -- copilot-output-parser.test.ts
  ```

- [ ] Create a sample Copilot output file with real data from Phase 1
  ```bash
  copilot chat "Sample query" --format json > sample-output.jsonl
  ```

- [ ] Test parser against real output
  ```typescript
  // Temporary test script
  import fs from 'fs';
  import { CopilotOutputParser } from './src/main/parsers/copilot-output-parser';
  
  const parser = new CopilotOutputParser();
  const lines = fs.readFileSync('sample-output.jsonl', 'utf-8').split('\n');
  
  for (const line of lines) {
    const result = parser.parseJsonLine(line);
    console.log('Parsed:', result);
  }
  ```

## Verification Checklist

### Code Quality
- [ ] Parser class implements AgentOutputParser interface
- [ ] All methods are implemented
- [ ] Error handling for malformed input
- [ ] Logging for debugging
- [ ] TypeScript compilation succeeds

### Functionality
- [ ] parseJsonLine correctly identifies event types
- [ ] Text content is extracted properly
- [ ] Session IDs are captured (if applicable)
- [ ] Error events are handled correctly
- [ ] Empty/whitespace lines are skipped
- [ ] Malformed JSON doesn't crash parser

### Integration
- [ ] Parser is registered in index.ts
- [ ] getOutputParser('copilot-cli') returns correct parser
- [ ] Parser is exported for use by process manager

### Testing
- [ ] Unit tests pass
- [ ] Manual testing with real Copilot output succeeds
- [ ] Edge cases are handled
- [ ] No console errors during parsing

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Parse error: undefined field" | Review Phase 1 JSON structure, update field names in parser |
| "Parser returns null for valid input" | Debug JSON structure, log raw output to identify mismatch |
| "Session IDs not captured" | Verify field name in Copilot output, update extraction code |
| "Tests fail but manual parsing works" | Check mock data format matches real output |

## Notes

**Key Dependencies:**
- Phase 1 JSON output format documentation is critical
- Exact field names must match Copilot's output
- Event type names must be correctly mapped

**Next Steps:**
Once parser is tested and verified:
1. Proceed to Phase 4: CLI Spawner Integration
2. Parser will be used when spawning agents
3. Real end-to-end testing can begin
