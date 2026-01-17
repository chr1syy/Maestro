/**
 * GitHub Copilot CLI Output Parser
 *
 * Parses plain text output from Copilot CLI (`copilot -p "..." --allow-all-tools --silent`).
 * 
 * Key characteristics:
 * - Output is PLAIN TEXT only (no JSON support)
 * - With `--silent` flag: Clean text response only
 * - Without `--silent`: Response followed by blank line and stats section
 * - Exit code 0 = success (but must check text for actual result)
 * - Permission denied returns exit code 0 with error text in response
 *
 * This parser handles plain text accumulation since Copilot doesn't provide
 * structured JSON output like other agents (Claude Code, OpenCode, Codex).
 */

import type { AgentOutputParser, ParsedEvent } from './agent-output-parser';
import type { AgentError } from '../../shared/types';
import { getErrorPatterns, matchErrorPattern } from './error-patterns';

/**
 * GitHub Copilot CLI Output Parser
 *
 * Handles plain text output from Copilot CLI.
 * Accumulates text content and detects errors using error patterns.
 */
export class CopilotOutputParser implements AgentOutputParser {
  /**
   * Agent ID for this parser
   */
  readonly agentId = 'copilot-cli' as const;

  /**
   * Parses a line of plain text output from Copilot CLI
   * Since Copilot outputs plain text, we treat each line as content
   * and accumulate it as text events.
   *
   * @param line - A line of output from Copilot
   * @returns Parsed event or null if line should be skipped
   */
  parseJsonLine(line: string): ParsedEvent | null {
    // Skip empty lines and whitespace-only lines
    if (!line || !line.trim()) {
      return null;
    }

    // Parse as a text event
    const event: ParsedEvent = {
      type: 'text',
      text: line,
    };

    return event;
  }

  /**
   * Check if an event is a final result message
   * For Copilot, we don't have structured result events (output is plain text).
   * The process manager determines completion based on process exit.
   *
   * @param _event - The parsed event (unused)
   * @returns false (no structured result events in Copilot)
   */
  isResultMessage(_event: ParsedEvent): boolean {
    return false;
  }

  /**
   * Extract session ID from an event
   * Copilot manages sessions automatically in ~/.copilot/session-state/
   * Since Copilot doesn't return session IDs, we use a stable identifier for Maestro tracking.
   * The format: "copilot-session-{timestamp}" ensures uniqueness across restarts.
   *
   * @param _event - The parsed event (unused)
   * @returns A stable session identifier for Maestro's session persistence
   */
  extractSessionId(_event: ParsedEvent): string | null {
    // Generate a stable session ID for Maestro's session system
    // This allows Maestro to track Copilot sessions even though Copilot manages them internally
    // The sessionId is typically passed from ProcessManager, but we return null here
    // to let ProcessManager handle session ID generation based on process spawn time
    return null;
  }

  /**
   * Extract usage statistics from an event
   * Copilot provides usage stats in the stats section (after blank line),
   * but since we use --silent flag, this is not included in output
   *
   * @param _event - The parsed event (unused)
   * @returns null (Copilot doesn't provide usage stats with --silent flag)
   */
  extractUsage(_event: ParsedEvent): ParsedEvent['usage'] | null {
    return null;
  }

  /**
   * Extract slash commands from Copilot output
   * Copilot CLI doesn't support slash commands in batch mode
   *
   * @param _event - The parsed event (unused)
   * @returns null (Copilot doesn't support slash commands)
   */
  extractSlashCommands(_event: ParsedEvent): string[] | null {
    return null;
  }

  /**
   * Detect errors in Copilot output using error patterns
   *
   * @param line - A line of output to check for errors
   * @returns AgentError if error detected, null otherwise
   */
  detectErrorFromLine(line: string): AgentError | null {
    // Skip empty lines
    if (!line || !line.trim()) {
      return null;
    }

    // Get error patterns for Copilot CLI
    const patterns = getErrorPatterns('copilot-cli');
    if (!patterns) {
      return null;
    }

    // Match against error patterns
    const match = matchErrorPattern(patterns, line);
    if (!match) {
      return null;
    }

    return {
      type: match.type,
      message: match.message,
      recoverable: match.recoverable,
      agentId: this.agentId,
      timestamp: Date.now(),
      raw: {
        errorLine: line,
      },
    };
  }

  /**
   * Detect an error from process exit information
   *
   * @param exitCode - The process exit code
   * @param stderr - The stderr output
   * @param stdout - The stdout output (may contain error message)
   * @returns AgentError if error detected, null otherwise
   */
  detectErrorFromExit(
    exitCode: number,
    stderr: string,
    stdout: string
  ): AgentError | null {
    // Exit code 0 is success (Copilot returns 0 even for permission denied)
    if (exitCode === 0) {
      return null;
    }

    // Check stderr and stdout for error patterns
    const combined = `${stderr}\n${stdout}`;
    const patterns = getErrorPatterns('copilot-cli');
    if (!patterns) {
      return null;
    }

    const match = matchErrorPattern(patterns, combined);

    if (match) {
      return {
        type: match.type,
        message: match.message,
        recoverable: match.recoverable,
        agentId: this.agentId,
        timestamp: Date.now(),
        raw: {
          exitCode,
          stderr,
          stdout,
        },
      };
    }

    // Non-zero exit with no recognized pattern - treat as crash
    return {
      type: 'agent_crashed',
      message: `Copilot CLI exited with code ${exitCode}`,
      recoverable: true,
      agentId: this.agentId,
      timestamp: Date.now(),
      raw: {
        exitCode,
        stderr,
        stdout,
      },
    };
  }
}
