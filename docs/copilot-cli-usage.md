# GitHub Copilot CLI Integration

Maestro integrates seamlessly with GitHub Copilot CLI, allowing you to interact with Copilot's AI assistant directly within your workflow. This document explains how to use Copilot CLI with Maestro's UI.

## Table of Contents

- [Quick Start](#quick-start)
- [Overview](#overview)
- [Getting Started](#getting-started)
- [Creating Sessions](#creating-sessions)
- [Session Management](#session-management)
- [Resuming Sessions](#resuming-sessions)
- [Model Selection](#model-selection)
- [Settings & Configuration](#settings--configuration)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Streaming Output](#streaming-output)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

**New to Copilot CLI in Maestro? Get started in 3 simple steps:**

### 1. Install & Authenticate

```bash
# Install Copilot CLI via GitHub CLI
gh extension install github/gh-copilot

# Authenticate with GitHub
copilot auth
```

### 2. Create Your First Session

![Creating a Copilot Session](./screenshots/copilot-create-session.png)

1. Press `Cmd+N` (macOS) or `Ctrl+N` (Windows/Linux)
2. Select **"GitHub Copilot CLI"** from the agent dropdown
3. Choose your project directory
4. Enter your query (e.g., "How do I set up a React project with TypeScript?")
5. Click **"Create Session"**

### 3. Watch Your Response Stream In

![Copilot Streaming Output](./screenshots/copilot-streaming-output.png)

Copilot's response appears in real-time in the output panel. You can:
- Copy the entire transcript with one click
- Resume the conversation later with `--continue`
- Switch models for different types of queries

**That's it!** You're ready to use Copilot CLI in Maestro. Continue reading for advanced features and configuration.

---

## Overview

GitHub Copilot CLI provides AI-powered assistance for command-line tasks, code explanations, and development guidance. Maestro enhances this experience with:

- **Session Management**: All Copilot interactions are saved and can be resumed
- **Multi-Tab Support**: Work on multiple queries simultaneously
- **Streaming Output**: Real-time response display
- **Model Selection**: Choose from multiple AI models (Claude, GPT, Gemini)
- **Unified UI**: Copilot sessions integrate seamlessly with other AI agents

### How It Works

When you create a Copilot session in Maestro:
1. Maestro spawns the `copilot` CLI process with appropriate flags
2. Your query is sent via the `-p` (prompt) flag
3. Responses stream back in real-time and display in the output panel
4. Sessions are automatically persisted to disk
5. You can resume previous sessions using the `--continue` flag

---

## Getting Started

### Prerequisites

1. **Install GitHub Copilot CLI**: Follow GitHub's official installation guide
   ```bash
   # Install via GitHub CLI extension
   gh extension install github/gh-copilot
   ```

2. **Authenticate**: Run the auth command once
   ```bash
   copilot auth
   ```

3. **Verify Installation**: Maestro will auto-detect the `copilot` binary in your PATH

### First Session

1. Click the **"New Session"** button (or press `Cmd+N` / `Ctrl+N`)
2. Select **"GitHub Copilot CLI"** from the agent dropdown
3. Choose your working directory
4. Enter your initial prompt (e.g., "Explain how to set up a Node.js project")
5. Click **"Create Session"**

Maestro will spawn Copilot and stream the response in real-time.

---

## Creating Sessions

### Via UI

The **New Session** dialog provides the following options:

- **Agent**: Select "GitHub Copilot CLI"
- **Working Directory**: Your project directory (for context)
- **Model**: Choose AI model (default: `claude-sonnet-4.5`)
- **Initial Prompt**: Your question or request
- **Tool Access**: Enable/disable `--allow-all-tools` flag (see [Settings](#settings--configuration))

### Session Options

When creating a Copilot session, you can configure:

- **Model Selection**: Choose from Claude, GPT, or Gemini models
- **Context Window**: Set maximum token limit (default: 200,000)
- **Tool Allowance**: Whether Copilot can execute tools/commands

---

## Session Management

![Copilot Session List](./screenshots/copilot-session-list.png)

### Session List

All Copilot sessions appear in the **left sidebar** with:

- **Session Name**: Auto-generated or custom
- **Tool Type**: Shows "copilot-cli"
- **Status Indicator**: Idle, Busy, or Completed
- **Last Activity**: Timestamp of most recent interaction
- **Model Badge**: Which AI model was used

### Session Actions

Right-click on any session to access:

- **Resume Session**: Continue the conversation with `--continue` flag
- **Rename Session**: Give it a descriptive name
- **Duplicate Session**: Create a copy
- **Delete Session**: Remove session and its history
- **Archive Session**: Move to archived sessions

### Sorting & Filtering

- **Default Sort**: Most recent first
- **Filter**: Type in the search box to filter by name
- **Group by Model**: Optionally group sessions by AI model

---

## Resuming Sessions

Copilot CLI automatically manages session state in `~/.copilot/session-state/`. Maestro leverages this to enable seamless session resumption.

### Resume Methods

![Resume Session Dialog](./screenshots/copilot-resume-session.png)

1. **Context Menu**: Right-click session → "Resume Session"
2. **Keyboard Shortcut**: `Cmd+Option+C` / `Ctrl+Alt+C` (resumes latest Copilot session)
3. **Direct Click**: Click on a completed session to view history, then "Continue" button

### How Resume Works

When you resume a Copilot session:
1. Maestro adds the `--continue` flag to the command
2. Copilot loads the most recent internal session state
3. Your new prompt is appended to the existing conversation
4. The response streams back and appends to your transcript

### Multi-Turn Conversations

Example workflow:
```
[You]: What is TypeScript?
[Copilot]: TypeScript is a statically typed superset of JavaScript...

[You resume]: Give me a simple example
[Copilot]: Here's a basic TypeScript example...

[You resume]: How do I configure tsconfig.json?
[Copilot]: Here's a typical tsconfig.json setup...
```

All interactions are preserved in the session transcript.

---

## Model Selection

### Available Models

Copilot CLI supports multiple AI models:

#### Claude (Anthropic)
- `claude-sonnet-4.5` (default) - Best balance of speed and capability
- `claude-opus-4.5` - Highest capability, slower
- `claude-haiku-4.5` - Fastest, good for simple tasks

#### GPT (OpenAI)
- `gpt-5.2-codex` - Code-specialized variant
- `gpt-5.2` - Latest generation model
- `gpt-4.1` - Stable previous generation

#### Gemini (Google)
- `gemini-3-pro-preview` - Google's latest model

### Setting Model

#### Per-Session Model
1. In the New Session dialog, select from the **Model** dropdown
2. The model is saved with the session
3. Resuming the session uses the same model (unless changed)

#### Default Model
1. Open **Settings** (`Cmd+,` / `Ctrl+,`)
2. Navigate to **Agents** → **GitHub Copilot CLI**
3. Set your preferred default model
4. New sessions will use this model unless overridden

### Model Persistence

![Model Selection in Session](./screenshots/copilot-model-selection.png)

- Each session remembers which model was used
- Maestro displays the model in session metadata
- You can change the model when resuming a session

---

## Settings & Configuration

![Copilot Settings](./screenshots/copilot-settings.png)

### Accessing Settings

1. Open **Settings** via menu or `Cmd+,` / `Ctrl+,`
2. Navigate to **Agents** → **GitHub Copilot CLI**

### Configuration Options

#### Model Selection
- **Type**: Dropdown
- **Default**: `claude-sonnet-4.5`
- **Description**: AI model for new sessions

#### Context Window Size
- **Type**: Number (tokens)
- **Default**: 200,000
- **Description**: Maximum context size for requests

#### Allow All Tools
- **Type**: Toggle
- **Default**: Enabled
- **Description**: Controls the `--allow-all-tools` flag

![Allow All Tools Warning](./screenshots/copilot-allow-tools-warning.png)

**⚠️ Warning**: Enabling "Allow All Tools" lets Copilot execute commands and tools. Only use in trusted environments.

### Agent Path Override

If Maestro doesn't detect `copilot` automatically:
1. Go to **Settings** → **Agents** → **GitHub Copilot CLI**
2. Set **Custom Path** to the full path of your `copilot` binary
   - Example: `/usr/local/bin/copilot`

---

## Keyboard Shortcuts

### Copilot-Specific Shortcuts

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| New Copilot Session | `Cmd+Shift+C` | `Ctrl+Shift+C` |
| Resume Latest Session | `Cmd+Option+C` | `Ctrl+Alt+C` |

### General Session Shortcuts

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| New Session | `Cmd+N` | `Ctrl+N` |
| Close Tab | `Cmd+W` | `Ctrl+W` |
| Next Tab | `Cmd+]` | `Ctrl+]` |
| Previous Tab | `Cmd+[` | `Ctrl+[` |
| Session Jump (1-9) | `Cmd+Option+1-9` | `Ctrl+Alt+1-9` |

### Customizing Shortcuts

1. Open **Settings** → **Keyboard Shortcuts**
2. Search for "Copilot"
3. Click on the shortcut to change it
4. Press your desired key combination

---

## Streaming Output

### Real-Time Display

Copilot responses stream in real-time:
- Output appears incrementally as Copilot generates it
- Auto-scroll keeps the latest content visible
- You can scroll up to review earlier parts

### Output Controls

- **Copy Transcript**: Click the copy button to copy entire session output
- **Export**: Save transcript to a text file
- **Auto-Scroll Toggle**: Disable auto-scroll to read at your own pace

### Formatting

Copilot output supports:
- Plain text responses
- Code blocks with syntax highlighting
- Markdown formatting (headers, lists, links)
- ANSI color codes (if present)

---

## Error Handling

![Copilot Error Banner](./screenshots/copilot-error-banner.png)

### Common Errors

#### Authentication Error
**Error Message**: `Authentication required` or `Not authenticated`

**Solution**:
1. Run `copilot auth` in your terminal
2. Follow the authentication flow
3. Retry your query in Maestro

#### Rate Limit Error
**Error Message**: `Rate limit exceeded` or `Too many requests`

**Solution**:
- Wait a few minutes before retrying
- GitHub Copilot has usage limits based on your subscription

#### Command Not Found
**Error Message**: `copilot: command not found`

**Solution**:
1. Verify Copilot CLI is installed: `which copilot`
2. If not found, install via: `gh extension install github/gh-copilot`
3. Restart Maestro after installation

### Error Display

When errors occur:
- **Error Banner**: Appears at the top of the output panel
- **Actionable Guidance**: Maestro suggests next steps (e.g., "Run copilot auth")
- **Learn More Link**: Opens documentation for the specific error

### Exit Code 0 Errors

Copilot CLI sometimes returns exit code 0 even when errors occur. Maestro detects errors by:
- Parsing stderr output for error patterns
- Looking for keywords like "ERROR", "failed", "permission denied"
- Displaying appropriate error messages in the UI

---

## Troubleshooting

### Session Not Resuming

**Symptom**: Resume doesn't continue the conversation

**Possible Causes**:
1. Copilot's internal session expired (after ~24 hours of inactivity)
2. Session state files in `~/.copilot/session-state/` were deleted

**Solution**:
- Start a new session instead of resuming
- Copilot maintains session state for ~24 hours

### Slow Responses

**Symptom**: Copilot takes a long time to respond

**Possible Causes**:
1. Model selection (Claude Opus is slower than Sonnet)
2. Large context window
3. Network latency

**Solutions**:
- Try a faster model like `claude-sonnet-4.5` or `claude-haiku-4.5`
- Reduce context window size in settings
- Check your internet connection

### Model Not Available

**Symptom**: Selected model fails with "model not available" error

**Possible Causes**:
1. Model requires higher Copilot subscription tier
2. Model is in preview and not yet released

**Solution**:
- Use default model (`claude-sonnet-4.5`)
- Check GitHub Copilot documentation for model availability

### Output Not Displaying

**Symptom**: Session starts but no output appears

**Possible Causes**:
1. Copilot process crashed
2. Output parser error

**Solution**:
1. Check Process Monitor (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Look for error logs
3. Restart Maestro
4. Report issue on GitHub with logs

### Permission Denied Errors

**Symptom**: `Permission denied` when using tools

**Possible Causes**:
1. `--allow-all-tools` flag not set
2. Insufficient file/directory permissions

**Solution**:
1. Enable "Allow All Tools" in settings
2. Check file permissions in your working directory
3. Run Maestro with appropriate privileges (avoid sudo unless necessary)

---

## Advanced Usage

### Multiple Concurrent Sessions

You can run multiple Copilot sessions simultaneously:
1. Each session is independent
2. Sessions use separate internal state
3. Maestro tracks all sessions in the session list

### Session Tabs

Create multiple tabs within a session:
1. Click "New Tab" button (`Cmd+T` / `Ctrl+T`)
2. Each tab can have a different Copilot session
3. Tabs share the session UI but have independent conversations

### Bookmarking Sessions

Save important sessions for quick access:
1. Right-click session → "Add to Bookmarks"
2. Bookmarked sessions appear in the Bookmarks section
3. Access via sidebar or `Cmd+B` / `Ctrl+B`

### Exporting Sessions

Export session transcripts:
1. Right-click session → "Export"
2. Choose format: Plain Text, Markdown, or JSON
3. Save to file for documentation or sharing

---

## Integration with Other Tools

### Using with Terminal Sessions

1. Run Copilot queries in AI sessions
2. Execute suggested commands in terminal sessions
3. Switch between sessions seamlessly

### Git Integration

Copilot sessions are context-aware:
- Maestro passes your working directory to Copilot
- Copilot can reference your project structure
- Use with git repositories for contextual assistance

---

## Tips & Best Practices

### Effective Prompting

- **Be Specific**: "Explain async/await in TypeScript" vs "How does async work?"
- **Provide Context**: Mention your environment (Node.js, browser, etc.)
- **Break Down Complex Tasks**: Ask step-by-step rather than all at once

### Session Organization

- **Name Sessions Descriptively**: "TypeScript Setup Guide" vs "Session 1"
- **Use Bookmarks**: Save frequently referenced sessions
- **Archive Old Sessions**: Keep your list clean

### Performance

- **Use Appropriate Models**: Haiku for quick tasks, Opus for complex reasoning
- **Manage Context Window**: Larger isn't always better (costs tokens)
- **Resume Wisely**: Long conversations can exceed context limits

---

## FAQ

### Q: Can I use Copilot without GitHub Copilot subscription?
**A**: No, Copilot CLI requires an active GitHub Copilot subscription (Individual or Business).

### Q: Does Maestro send my data to third parties?
**A**: Maestro only acts as a UI wrapper. All data is sent directly to GitHub/Copilot per their privacy policy.

### Q: Can I use Copilot offline?
**A**: No, Copilot CLI requires an internet connection to communicate with GitHub's servers.

### Q: Where are sessions stored?
**A**: Maestro stores session metadata in `~/.maestro/maestro-sessions.json`. Copilot's internal session state is in `~/.copilot/session-state/`.

### Q: Can I edit previous prompts?
**A**: Not currently. Copilot CLI doesn't support editing history. Start a new query or resume with corrections.

### Q: How long do sessions last?
**A**: Copilot's internal sessions expire after ~24 hours of inactivity. Maestro keeps metadata indefinitely.

---

## Resources

- **GitHub Copilot Documentation**: https://docs.github.com/copilot
- **Copilot CLI Guide**: https://docs.github.com/copilot/cli
- **Maestro GitHub**: https://github.com/your-org/maestro
- **Issue Tracker**: https://github.com/your-org/maestro/issues

---

## See Also

- [General Usage Guide](./general-usage.md)
- [Keyboard Shortcuts](./keyboard-shortcuts.md)
- [Troubleshooting](./troubleshooting.md)
- [Configuration Guide](./configuration.md)
