/**
 * Tests for CopilotOutputParser
 *
 * Tests plain text parsing, error detection, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CopilotOutputParser } from '../../../main/parsers/copilot-output-parser';

describe('CopilotOutputParser', () => {
  let parser: CopilotOutputParser;

  beforeEach(() => {
    parser = new CopilotOutputParser();
  });

  describe('agentId', () => {
    it('should have correct agent ID', () => {
      expect(parser.agentId).toBe('copilot-cli');
    });
  });

  describe('parseJsonLine', () => {
    it('should parse simple text line as text event', () => {
      const input = 'Hello from Copilot';
      const result = parser.parseJsonLine(input);

      expect(result).toBeDefined();
      expect(result?.type).toBe('text');
      expect(result?.text).toBe('Hello from Copilot');
    });

    it('should parse multi-line text content', () => {
      const inputs = [
        'Here is the solution:',
        'function add(a, b) {',
        '  return a + b;',
        '}',
      ];

      const results = inputs.map(line => parser.parseJsonLine(line));

      results.forEach((result, idx) => {
        expect(result).toBeDefined();
        expect(result?.type).toBe('text');
        expect(result?.text).toBe(inputs[idx]);
      });
    });

    it('should handle empty strings', () => {
      const result = parser.parseJsonLine('');
      expect(result).toBeNull();
    });

    it('should handle whitespace-only strings', () => {
      expect(parser.parseJsonLine('   ')).toBeNull();
      expect(parser.parseJsonLine('\t')).toBeNull();
      expect(parser.parseJsonLine('\n')).toBeNull();
    });

    it('should preserve leading and trailing spaces in content', () => {
      const input = '  indented line  ';
      const result = parser.parseJsonLine(input);

      expect(result).toBeDefined();
      expect(result?.text).toBe('  indented line  ');
    });

    it('should handle special characters', () => {
      const inputs = [
        'Special chars: !@#$%^&*()',
        'Code: const x = `template ${string}`;',
        'Unicode: 你好 🎉 émoji',
      ];

      inputs.forEach(input => {
        const result = parser.parseJsonLine(input);
        expect(result).toBeDefined();
        expect(result?.text).toBe(input);
      });
    });

    it('should handle very long lines', () => {
      const longLine = 'a'.repeat(10000);
      const result = parser.parseJsonLine(longLine);

      expect(result).toBeDefined();
      expect(result?.text).toBe(longLine);
    });
  });

  describe('extractSlashCommands', () => {
    it('should return null for all events', () => {
      const event = parser.parseJsonLine('test');
      expect(event).toBeDefined();

      const result = parser.extractSlashCommands(event!);
      expect(result).toBeNull();
    });

    it('should return null even if text contains slash commands', () => {
      const event = parser.parseJsonLine('/help is not supported');
      const result = parser.extractSlashCommands(event!);
      expect(result).toBeNull();
    });
  });

  describe('detectError - Authentication Errors', () => {
    it('should detect "not authenticated" error', () => {
      const line = 'Error: not authenticated. Please run gh auth login';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('auth_expired');
      expect(error?.message).toContain('Authentication');
    });

    it('should detect "authentication failed" error', () => {
      const line = 'Authentication failed: invalid credentials';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('auth_expired');
    });

    it('should detect "token expired" error', () => {
      const line = 'Error: token expired, please reauthenticate';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('auth_expired');
    });
  });

  describe('detectError - Rate Limit Errors', () => {
    it('should detect "rate limit exceeded" error', () => {
      const line = 'Error: rate limit exceeded. Please wait before retrying.';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('rate_limited');
    });

    it('should detect "too many requests" error', () => {
      const line = 'Error: too many requests, try again later';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('rate_limited');
    });

    it('should detect "quota exceeded" error', () => {
      const line = 'Error: quota exceeded for this month';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('rate_limited');
    });
  });

  describe('detectError - Network Errors', () => {
    it('should detect "connection failed" error', () => {
      const line = 'Error: connection failed to API server';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('network_error');
    });

    it('should detect "connection refused" error', () => {
      const line = 'Error: connection refused on port 443';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('network_error');
    });

    it('should detect "ECONNREFUSED" network error', () => {
      const line = 'Error: ECONNREFUSED: connect failed';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('network_error');
    });

    it('should detect "ETIMEDOUT" network error', () => {
      const line = 'Error: ETIMEDOUT: connection timeout';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('network_error');
    });

    it('should detect "ENOTFOUND" network error', () => {
      const line = 'Error: ENOTFOUND: host not found';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('network_error');
    });
  });

  describe('detectError - Permission Denied', () => {
    it('should detect "permission denied" error', () => {
      const line = "Error: don't have permission to access this tool";
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('permission_denied');
    });

    it('should detect "permission denied" variant', () => {
      const line = 'Error: permission denied - use --allow-all-tools';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('permission_denied');
    });
  });

  describe('detectError - Agent Crashed', () => {
    it('should detect "cannot specify prompt" error', () => {
      const line = 'Error: cannot specify prompt both with -i and -p flags';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('agent_crashed');
    });

    it('should detect "invalid argument" error', () => {
      const line = 'Error: option --invalid-flag argument is invalid';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('agent_crashed');
    });

    it('should detect "fatal error" error', () => {
      const line = 'Fatal error: unexpected state reached';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('agent_crashed');
    });

    it('should detect "panic" error', () => {
      const line = 'panic: null pointer dereference';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeDefined();
      expect(error?.type).toBe('agent_crashed');
    });
  });

  describe('detectError - No Match', () => {
    it('should return null for normal output', () => {
      const line = 'This is a normal response from Copilot';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeNull();
    });

    it('should return null for code output', () => {
      const line = 'function hello() { return "world"; }';
      const error = parser.detectErrorFromLine(line);

      expect(error).toBeNull();
    });

    it('should return null for empty string', () => {
      const error = parser.detectErrorFromLine('');
      expect(error).toBeNull();
    });
  });

  describe('detectError - Case Insensitivity', () => {
    it('should match error patterns case-insensitively', () => {
      const lines = [
        'ERROR: NOT AUTHENTICATED',
        'error: not authenticated',
        'Error: Not Authenticated',
        'ErRoR: NoT AuThEnTiCaTeD',
      ];

      lines.forEach(line => {
        const error = parser.detectErrorFromLine(line);
        expect(error).toBeDefined();
        expect(error?.type).toBe('auth_expired');
      });
    });
  });

  describe('detectErrorFromExit', () => {
    it('should return null for exit code 0', () => {
      const error = parser.detectErrorFromExit(0, '', '');
      expect(error).toBeNull();
    });

    it('should detect error from non-zero exit code with matching pattern', () => {
      const error = parser.detectErrorFromExit(1, 'Error: not authenticated', '');
      expect(error).toBeDefined();
      expect(error?.type).toBe('auth_expired');
    });

    it('should detect error from stdout with matching pattern', () => {
      const error = parser.detectErrorFromExit(1, '', 'Error: rate limit exceeded');
      expect(error).toBeDefined();
      expect(error?.type).toBe('rate_limited');
    });

    it('should return agent_crashed for non-zero exit with no matching pattern', () => {
      const error = parser.detectErrorFromExit(1, 'Unknown error', '');
      expect(error).toBeDefined();
      expect(error?.type).toBe('agent_crashed');
      expect(error?.message).toContain('exited with code 1');
    });
  })

  describe('Integration - Simulated Response Parsing', () => {
    it('should parse a complete Copilot response (multiple lines)', () => {
      const responseLines = [
        'Here is a JavaScript function to add two numbers:',
        '',
        'function add(a, b) {',
        '  return a + b;',
        '}',
      ];

      const results = responseLines
        .map(line => parser.parseJsonLine(line))
        .filter(r => r !== null);

      // Should have 4 events (empty line filtered out)
      expect(results).toHaveLength(4);
      expect(results[0]?.text).toBe('Here is a JavaScript function to add two numbers:');
      expect(results[1]?.text).toBe('function add(a, b) {');
      expect(results[2]?.text).toBe('  return a + b;');
      expect(results[3]?.text).toBe('}');
    });

    it('should parse response with permission error', () => {
      const responseLine = 'Error: permission denied - use --allow-all-tools';
      const error = parser.detectErrorFromLine(responseLine);

      expect(error).toBeDefined();
      expect(error?.type).toBe('permission_denied');
      expect(error?.message).toContain('--allow-all-tools');
    });

    it('should handle mixed content with potential error', () => {
      const lines = [
        'Processing your request...',
        'Error: connection failed',
        'Retrying...',
      ];

      const events = lines.map((line) => {
        const error = parser.detectErrorFromLine(line);
        if (error) {
          return error; // Return the error object with type field
        }
        return parser.parseJsonLine(line);
      });

      expect(events).toHaveLength(3);
      expect(events[0]?.type).toBe('text');
      expect(events[1]?.type).toBe('network_error'); // Error returns the actual error type
      expect(events[2]?.type).toBe('text');
    });
  });

  describe('Edge Cases', () => {
    it('should handle lines with only symbols', () => {
      const result = parser.parseJsonLine('!@#$%^&*()');
      expect(result).toBeDefined();
      expect(result?.text).toBe('!@#$%^&*()');
    });

    it('should handle lines with tabs', () => {
      const result = parser.parseJsonLine('\tindented\t');
      expect(result).toBeDefined();
      expect(result?.text).toBe('\tindented\t');
    });

    it('should handle ANSI escape codes in output', () => {
      const result = parser.parseJsonLine('\x1b[31mRed text\x1b[0m');
      expect(result).toBeDefined();
      expect(result?.text).toBe('\x1b[31mRed text\x1b[0m');
    });

    it('should handle very long error messages', () => {
      const longError = 'Error: ' + 'a'.repeat(5000);
      const error = parser.detectErrorFromLine(longError);
      // This doesn't match any specific error pattern, so it returns null
      expect(error).toBeNull();
    });
  });
});
