# Phase 1: Research & Setup

Research and document GitHub Copilot CLI interface and capabilities.

## Investigation Tasks

### 1.1 Determine Copilot CLI Binary & Command Structure

**⚠️ USER INTERACTION REQUIRED**

- [x] Install GitHub Copilot CLI if not already installed
  - Reference: https://github.com/github/gh-copilot
  - Install via: `gh extension install github/gh-copilot` (requires `gh` CLI)
  - OR: Check if already available: `copilot --version`

- [x] **RUN TEST COMMAND & DOCUMENT OUTPUT:**
  ```bash
  copilot --help
  ```
  Document the output and capture:
  - [x] Available subcommands (e.g., `copilot chat`, `copilot explain`)
    - ✅ Primary command: `help [topic]` - Display help information
    - ✅ Help topics available: `config`, `commands`, `environment`, `logging`, `permissions`
    - ℹ️ **Key Finding**: Copilot is primarily **option/flag-driven**, not command-driven
    - ℹ️ Interactive/batch modes controlled via flags: `-i/--interactive`, `-p/--prompt`, `--continue`, `--resume`
  
  - [x] Global flags/options
    - ✅ **Interactive/Batch Mode:**
      - `-i, --interactive <prompt>` - Start interactive mode, auto-execute prompt
      - `-p, --prompt <text>` - Execute in non-interactive mode (batch, exits after)
      - `--continue` - Resume most recent session
      - `--resume [sessionId]` - Resume from previous session (with optional ID picker)
      - `-s, --silent` - Output only agent response (no stats, for scripting)
    - ✅ **Model Selection:**
      - `--model <model>` - Available: claude-sonnet-4.5, claude-haiku-4.5, claude-opus-4.5, claude-sonnet-4, gpt-5.2-codex, gpt-5.1-codex-max/max, gpt-5.1-codex, gpt-5.2, gpt-5.1, gpt-5, gpt-5.1-codex-mini, gpt-5-mini, gpt-4.1, gemini-3-pro-preview
    - ✅ **Permissions/Tool Control:**
      - `--yolo` / `--allow-all` - Enable all permissions (equivalent to all three below)
      - `--allow-all-tools` - Allow all tools without confirmation (required for non-interactive mode)
      - `--allow-all-paths` - Disable path verification, allow access to any path
      - `--allow-all-urls` - Allow access to all URLs without confirmation
      - `--allow-tool [tools...]` - Specific tool allowlist
      - `--deny-tool [tools...]` - Tool denylist (takes precedence)
      - `--allow-url [urls...]` - URL allowlist (HTTPS by default)
      - `--deny-url [urls...]` - URL denylist (takes precedence)
      - `--available-tools [tools...]` - Only these tools available to model
      - `--excluded-tools [tools...]` - These tools NOT available to model
      - `--add-dir <directory>` - Add directory to allowed list (can be repeated)
      - `--disallow-temp-dir` - Prevent automatic temp directory access
    - ✅ **Configuration:**
      - `--config-dir <directory>` - Set config directory (default: ~/.copilot)
      - `--log-dir <directory>` - Set log directory (default: ~/.copilot/logs/)
      - `--log-level <level>` - Set log level: none, error, warning, info, debug, all, default
      - `--agent <agent>` - Specify custom agent
      - `--no-custom-instructions` - Disable custom instructions from AGENTS.md
      - `--no-auto-update` - Disable auto-update
    - ✅ **Output/Display:**
      - `--no-color` - Disable color output
      - `--plain-diff` - Disable rich diff rendering
      - `--banner` - Show startup banner
      - `--share [path]` - Share session to markdown file (default: ./copilot-session-<id>.md)
      - `--share-gist` - Share session to secret GitHub gist
      - `--stream <mode>` - Enable/disable streaming: on, off
      - `--screen-reader` - Enable screen reader optimizations
    - ✅ **MCP Server (Model Context Protocol):**
      - `--add-github-mcp-tool <tool>` - Add tool for GitHub MCP (can be repeated)
      - `--add-github-mcp-toolset <toolset>` - Add toolset for GitHub MCP (can be repeated)
      - `--enable-all-github-mcp-tools` - Enable all GitHub MCP tools
      - `--additional-mcp-config <json>` - Additional MCP config as JSON/file (can be repeated)
      - `--disable-builtin-mcps` - Disable built-in MCP servers
      - `--disable-mcp-server <server-name>` - Disable specific MCP server (can be repeated)
      - `--disable-parallel-tools-execution` - Disable parallel tool execution
    - ✅ **Informational:**
      - `-v, --version` - Show version info
      - `-h, --help` - Display help
  
  - [x] Help text format
    - ✅ **Structure:**
      1. Usage line: `Usage: copilot [options] [command]`
      2. Brief description (one-liner)
      3. Options section (alphabetically sorted with descriptions)
      4. Commands section (available commands)
      5. Help Topics section (accessible via `help [topic]`)
      6. Examples section (real usage patterns)
    - ✅ **Option format:** `-shortflag, --longflag <arg>` followed by description and defaults
    - ✅ **Default values** shown in descriptions: ~/.copilot, ~/.copilot/logs/, none for log-level
    - ✅ **Environment variables** referenced: `(env: COPILOT_ALLOW_ALL)` format
    - ✅ **Examples show:** interactive mode, batch mode, model selection, session resumption, permissions, MCP config

  ### Output:

  ```bash
  chr1syy@ubuntu:~/Maestro$ copilot --help
Usage: copilot [options] [command]

GitHub Copilot CLI - An AI-powered coding assistant

Options:
  --add-dir <directory>               Add a directory to the allowed list for
                                      file access (can be used multiple times)
  --add-github-mcp-tool <tool>        Add a tool to enable for the GitHub MCP
                                      server instead of the default CLI subset
                                      (can be used multiple times). Use "*" for
                                      all tools.
  --add-github-mcp-toolset <toolset>  Add a toolset to enable for the GitHub MCP
                                      server instead of the default CLI subset
                                      (can be used multiple times). Use "all"
                                      for all toolsets.
  --additional-mcp-config <json>      Additional MCP servers configuration as
                                      JSON string or file path (prefix with @)
                                      (can be used multiple times; augments
                                      config from ~/.copilot/mcp-config.json for
                                      this session)
  --agent <agent>                     Specify a custom agent to use
  --allow-all                         Enable all permissions (equivalent to
                                      --allow-all-tools --allow-all-paths
                                      --allow-all-urls)
  --allow-all-paths                   Disable file path verification and allow
                                      access to any path
  --allow-all-tools                   Allow all tools to run automatically
                                      without confirmation; required for
                                      non-interactive mode (env:
                                      COPILOT_ALLOW_ALL)
  --allow-all-urls                    Allow access to all URLs without
                                      confirmation
  --allow-tool [tools...]             Tools the CLI has permission to use; will
                                      not prompt for permission
  --allow-url [urls...]               Allow access to specific URLs or domains
  --available-tools [tools...]        Only these tools will be available to the
                                      model
  --banner                            Show the startup banner
  --config-dir <directory>            Set the configuration directory (default:
                                      ~/.copilot)
  --continue                          Resume the most recent session
  --deny-tool [tools...]              Tools the CLI does not have permission to
                                      use; will not prompt for permission
  --deny-url [urls...]                Deny access to specific URLs or domains,
                                      takes precedence over --allow-url
  --disable-builtin-mcps              Disable all built-in MCP servers
                                      (currently: github-mcp-server)
  --disable-mcp-server <server-name>  Disable a specific MCP server (can be used
                                      multiple times)
  --disable-parallel-tools-execution  Disable parallel execution of tools (LLM
                                      can still make parallel tool calls, but
                                      they will be executed sequentially)
  --disallow-temp-dir                 Prevent automatic access to the system
                                      temporary directory
  --enable-all-github-mcp-tools       Enable all GitHub MCP server tools instead
                                      of the default CLI subset. Overrides
                                      --add-github-mcp-toolset and
                                      --add-github-mcp-tool options.
  --excluded-tools [tools...]         These tools will not be available to the
                                      model
  -h, --help                          display help for command
  -i, --interactive <prompt>          Start interactive mode and automatically
                                      execute this prompt
  --log-dir <directory>               Set log file directory (default:
                                      ~/.copilot/logs/)
  --log-level <level>                 Set the log level (choices: "none",
                                      "error", "warning", "info", "debug",
                                      "all", "default")
  --model <model>                     Set the AI model to use (choices:
                                      "claude-sonnet-4.5", "claude-haiku-4.5",
                                      "claude-opus-4.5", "claude-sonnet-4",
                                      "gpt-5.2-codex", "gpt-5.1-codex-max",
                                      "gpt-5.1-codex", "gpt-5.2", "gpt-5.1",
                                      "gpt-5", "gpt-5.1-codex-mini",
                                      "gpt-5-mini", "gpt-4.1",
                                      "gemini-3-pro-preview")
  --no-auto-update                    Disable downloading CLI update
                                      automatically
  --no-color                          Disable all color output
  --no-custom-instructions            Disable loading of custom instructions
                                      from AGENTS.md and related files
  -p, --prompt <text>                 Execute a prompt in non-interactive mode
                                      (exits after completion)
  --plain-diff                        Disable rich diff rendering (syntax
                                      highlighting via diff tool specified by
                                      git config)
  --resume [sessionId]                Resume from a previous session (optionally
                                      specify session ID)
  -s, --silent                        Output only the agent response (no stats),
                                      useful for scripting with -p
  --screen-reader                     Enable screen reader optimizations
  --share [path]                      Share session to markdown file after
                                      completion in non-interactive mode
                                      (default: ./copilot-session-<id>.md)
  --share-gist                        Share session to a secret GitHub gist
                                      after completion in non-interactive mode
  --stream <mode>                     Enable or disable streaming mode (choices:
                                      "on", "off")
  -v, --version                       show version information
  --yolo                              Enable all permissions (equivalent to
                                      --allow-all-tools --allow-all-paths
                                      --allow-all-urls)

Commands:
  help [topic]                        Display help information

Help Topics:
  config       Configuration Settings
  commands     Interactive Mode Commands
  environment  Environment Variables
  logging      Logging
  permissions  Permissions

Examples:
  # Start interactive mode
  $ copilot

  # Start interactive mode and automatically execute a prompt
  $ copilot -i "Fix the bug in main.js"

  # Execute a prompt in non-interactive mode (exits after completion)
  $ copilot -p "Fix the bug in main.js" --allow-all-tools

  # Enable all permissions with a single flag
  $ copilot -p "Fix the bug in main.js" --allow-all
  $ copilot -p "Fix the bug in main.js" --yolo

  # Start with a specific model
  $ copilot --model gpt-5

  # Resume the most recent session
  $ copilot --continue

  # Resume a previous session using session picker
  $ copilot --resume

  # Resume with auto-approval
  $ copilot --allow-all-tools --resume

  # Allow access to additional directory
  $ copilot --add-dir /home/user/projects

  # Allow multiple directories
  $ copilot --add-dir ~/workspace --add-dir /tmp

  # Disable path verification (allow access to any path)
  $ copilot --allow-all-paths

  # Allow all git commands except git push
  $ copilot --allow-tool 'shell(git:*)' --deny-tool 'shell(git push)'

  # Allow all file editing
  $ copilot --allow-tool 'write'

  # Allow all but one specific tool from MCP server with name "MyMCP"
  $ copilot --deny-tool 'MyMCP(denied_tool)' --allow-tool 'MyMCP'

  # Allow GitHub API access (defaults to HTTPS)
  $ copilot --allow-url github.com

  # Deny access to specific domain over HTTPS
  $ copilot --deny-url https://malicious-site.com
  $ copilot --deny-url malicious-site.com

  # Allow all URLs without confirmation
  $ copilot --allow-all-urls
  ```

- [x] **RUN TEST QUERY & DOCUMENT OUTPUT:**
  ```bash
  # Tested: copilot chat "Hello, what is 2+2?" --output json
  # Result: error: unknown option '--output'
  # Also tested: No 'chat' subcommand exists
  ```
  Determine correct format flag:
  - [x] Does `--format json` work? ❌ No
  - [x] Try `--json` if above fails ❌ No
  - [x] Try `--output json` if above fails ❌ No (tested, failed)
  - [x] Document the exact flag that produces JSON output
    - ⚠️ **CRITICAL FINDING**: Copilot CLI has **NO JSON output mode**
    - Output is plain text only (human-readable format)
    - `-s, --silent` flag outputs only agent response (removes stats/banner)
    - This means we'll need to parse raw text output, NOT JSON events

### 1.2 Verify Output Format

- [ ] **RUN BATCH QUERY WITH JSON:**
  ```bash
  echo "What is a recursive function?" | copilot chat --format json
  ```
  OR determine stdin handling:
  ```bash
  copilot chat --format json "What is a recursive function?"
  ```

- [ ] **CAPTURE & ANALYZE OUTPUT:**
  Document the complete JSON structure:
  - [ ] Event types present (e.g., `type: "message"`, `type: "complete"`)
  - [ ] Message/text field names
  - [ ] Session ID field (if present)
  - [ ] Any usage/cost information
  - [ ] Error format when query fails
  - [ ] Whether output is JSON lines (JSONL) or single object

- [ ] **TEST STREAMING:**
  - [ ] Does output stream in real-time or buffer entire response?
  - [ ] Is JSONL format (one JSON per line) or concatenated?
  - [ ] How are streaming chunks delimited?

### 1.3 Session & Resume Handling

- [ ] **INVESTIGATE SESSION STORAGE:**
  ```bash
  copilot chat --help | grep -i session
  copilot chat --help | grep -i resume
  copilot chat --help | grep -i conversation
  ```

- [ ] Document findings:
  - [ ] Does Copilot support persistent sessions?
  - [ ] If yes, what's the session ID format?
  - [ ] How to resume a previous session?
  - [ ] Where are sessions stored?
  - [ ] Session expiration policy?

- [ ] **TEST SESSION PERSISTENCE (if supported):**
  ```bash
  SESSION_ID=$(copilot chat "Hello" --format json | grep -o '"session":"[^"]*"' | cut -d'"' -f4)
  copilot chat "Remember what I said?" --session "$SESSION_ID" --format json
  ```

### 1.4 Read-Only/Plan Mode Investigation

- [ ] **CHECK AVAILABLE MODES:**
  ```bash
  copilot chat --help | grep -i "mode\|explain\|plan"
  ```

- [ ] Document:
  - [ ] Is there a read-only/plan mode?
  - [ ] What subcommands are available? (e.g., `copilot chat`, `copilot explain`)
  - [ ] What's the difference between them?
  - [ ] Can `explain` mode be used as read-only alternative?

### 1.5 Model Selection Capabilities

- [ ] **CHECK MODEL OPTIONS:**
  ```bash
  copilot chat --help | grep -i model
  copilot chat --help | grep -i "gpt"
  ```

- [ ] Document:
  - [ ] What models are available? (gpt-4, gpt-3.5-turbo, etc.)
  - [ ] Is model selection via flag? (`--model`, `--gpt`, etc.)
  - [ ] What's the default model?
  - [ ] Can model be changed per-query?

### 1.6 Image & File Input Support

- [ ] **CHECK ATTACHMENT CAPABILITIES:**
  ```bash
  copilot chat --help | grep -i "image\|file\|attach\|upload"
  ```

- [ ] Document:
  - [ ] Are images/files supported?
  - [ ] What flag format? (`-i`, `--image`, `--file`, etc.)
  - [ ] Supported image formats?
  - [ ] Size limits?

### 1.7 Error Handling Format

- [ ] **TEST ERROR SCENARIOS:**
  - [ ] Invalid query: `copilot chat "" --format json`
  - [ ] Missing auth: Run without GitHub auth set up
  - [ ] Rate limited: (document if encountered)
  - [ ] Network error: (simulate or document)

- [ ] Document error format:
  - [ ] Error event type name
  - [ ] Error message field
  - [ ] Error code/type information
  - [ ] Stack trace format (if included)

## Documentation

Create a file: `Copilot CLI Investigation Results.md`

Document all findings:
- Command syntax and flags
- Full JSON output example (successful query)
- Full JSON output example (error case)
- JSON output for streaming (if applicable)
- Model list and defaults
- Session handling approach
- Any limitations or quirks

## Verification Checklist

Before moving to Phase 2, verify:

- [ ] Copilot CLI is installed and functional
- [ ] JSON output format is fully documented
- [ ] Session/resume capabilities understood
- [ ] All command-line flags documented
- [ ] Error format captured
- [ ] Model selection mechanism confirmed
- [ ] Output structure is consistent and repeatable
- [ ] Investigation results saved in documentation

## Notes

**Dependencies:**
- GitHub `gh` CLI must be installed
- GitHub authentication configured (`gh auth login`)
- `copilot` extension for `gh` CLI

**Common Issues:**
- If `copilot` command not found, ensure `gh extension install github/gh-copilot` was run
- Authentication may be required before first use
- Output format may vary by Copilot version

**Next Steps:**
Once investigation is complete, document all findings and proceed to Phase 2 with implementation.
