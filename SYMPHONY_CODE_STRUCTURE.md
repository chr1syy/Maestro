# Maestro Symphony Feature - Code Structure & "New Agent" Flow

## Overview

The Maestro Symphony feature is a community-driven program that connects Maestro users with open source repositories seeking contributions. When a user selects an open issue from the Symphony modal in `runmaestro` and clicks "New Agent" (labeled as "Start Symphony"), a complete workflow is triggered to:

1. Create a new agent session in Maestro
2. Clone the repository locally
3. Set up a new Git branch
4. Create a draft PR on GitHub
5. Set up Auto Run documents for processing
6. Begin the contribution workflow

---

## File Structure

```
E:\Programmierung\Worktrees\fix-win-symphony
├── src/
│   ├── shared/
│   │   ├── symphony-types.ts              # Type definitions (SymphonyIssue, ActiveContribution, etc.)
│   │   └── symphony-constants.ts          # Constants, URLs, cache TTLs, templates
│   │
│   ├── main/
│   │   ├── ipc/
│   │   │   └── handlers/
│   │   │       └── symphony.ts            # Main IPC handlers (2949 lines)
│   │   │
│   │   ├── services/
│   │   │   └── symphony-runner.ts         # Repository operations (clone, branch, PR creation)
│   │   │
│   │   └── preload/
│   │       └── symphony.ts                # IPC bridge for renderer process
│   │
│   ├── renderer/
│   │   ├── components/
│   │   │   ├── SymphonyModal.tsx          # Main UI modal with 4 tabs (Projects, Active, History, Stats)
│   │   │   └── AgentCreationDialog.tsx    # Dialog for selecting agent & working directory
│   │   │
│   │   └── hooks/
│   │       └── symphony/
│   │           ├── useSymphony.ts         # Registry, issues, contributions state management
│   │           ├── useContribution.ts     # Single contribution lifecycle
│   │           └── useContributorStats.ts # Achievement tracking
│   │
│   ├── App.tsx                            # Session creation integration point
│   │
│   └── __tests__/
│       ├── integration/symphony.integration.test.ts
│       ├── main/ipc/handlers/symphony.test.ts
│       ├── main/services/symphony-runner.test.ts
│       └── shared/symphony-*.test.ts
│
├── docs/
│   └── symphony.md                        # User documentation
│
├── SYMPHONY_ISSUES.md                     # Guide for creating Symphony-ready issues
├── SYMPHONY_REGISTRY.md                   # Registry management documentation
├── symphony-registry.json                 # Central registry of projects
```

---

## Data Flow: "Start Symphony" → "New Agent"

### 1. User Interaction Layer (Renderer)

#### SymphonyModal.tsx

- **Location**: `src/renderer/components/SymphonyModal.tsx`
- **Purpose**: Main UI for browsing Symphony projects and issues
- **Key Features**:
  - 4 tabs: Projects, Active, History, Stats
  - Repository browser with category/search filters
  - Issue list display with document previews
  - "Start Symphony" button (line 951)

**Event Flow**:

```
User clicks "Start Symphony" button
↓
handleStartContribution() called (line 1490)
↓
setShowAgentDialog(true)
↓
AgentCreationDialog opens
```

#### AgentCreationDialog.tsx

- **Location**: `src/renderer/components/AgentCreationDialog.tsx`
- **Purpose**: Dialog for selecting AI provider and working directory
- **Key Features**:
  - Filters agents to only those supporting batch mode (`supportsBatchMode === true`)
  - Auto-detects available agents via `window.maestro.agents.detect()`
  - Pre-fills session name: `Symphony: {owner/repo} #{issue}`
  - Pre-fills working directory: `~/Maestro-Symphony/{owner}-{repo}`
  - Optional custom path/args/env vars configuration

**State Management**:

```typescript
- selectedAgent: string (e.g., 'claude-code')
- sessionName: string (pre-filled)
- workingDirectory: string (pre-filled)
- isCreating: boolean (while submission is in progress)
- error: string | null
```

**Submit Handler** (line 1494 in SymphonyModal.tsx):

```typescript
handleCreateAgent(config) → startContribution() → onStartContribution()
```

---

### 2. Business Logic Layer (Hooks)

#### useSymphony.ts

- **Location**: `src/renderer/hooks/symphony/useSymphony.ts`
- **Purpose**: Central state management for Symphony feature
- **Key Functions**:
  - `fetchRegistry()` - Fetch from GitHub (cached 2 hours)
  - `selectRepository()` - Fetch issues from GitHub API
  - `startContribution()` - Orchestrate the contribution workflow

**startContribution() Implementation** (key function):

```typescript
const startContribution = useCallback(
  async (
    repo: RegisteredRepository,
    issue: SymphonyIssue,
    agentType: string,
    sessionId: string,
    workingDirectory?: string
  ): Promise<{
    success: boolean;
    contributionId?: string;
    branchName?: string;
    autoRunPath?: string;
    draftPrNumber?: number;
    draftPrUrl?: string;
    error?: string;
  }>
)
```

This function:

1. Generates a unique `contributionId`
2. Determines the `localPath` for cloning
3. Calls `window.maestro.symphony.cloneRepo()` to clone the repository
4. Calls `window.maestro.symphony.startContribution()` to set up branch/PR/documents

#### useContribution.ts

- **Location**: `src/renderer/hooks/symphony/useContribution.ts`
- **Purpose**: Manage single active contribution lifecycle
- **Polling**: Fetches contribution data every 2 seconds while running
- **Tracked Data**:
  - Current document being processed
  - Progress (completed/total documents)
  - Token usage (input/output tokens, estimated cost)
  - Time elapsed
  - Status (cloning, running, paused, completed, etc.)

---

### 3. IPC Bridge Layer (Preload)

#### symphony.ts (preload)

- **Location**: `src/main/preload/symphony.ts`
- **Purpose**: Exposes Symphony API to renderer process via `window.maestro.symphony`
- **Architecture**: Each function calls `ipcRenderer.invoke()` to communicate with main process

**Key Methods**:

```typescript
// Registry operations
getRegistry(forceRefresh?: boolean)
getIssues(repoSlug: string, forceRefresh?: boolean)

// State operations
getState()
getActive()
getCompleted(limit?: number)
getStats()

// Lifecycle
cloneRepo(params: { repoUrl, localPath })
startContribution(params: {
  contributionId, sessionId, repoSlug, issueNumber,
  issueTitle, localPath, documentPaths
})
registerActive(params)
updateStatus(params)
complete(params)
cancel(contributionId, cleanup?)

// Real-time events
onUpdated(callback)
onContributionStarted(callback)
onPRCreated(callback)
```

---

### 4. Main Process IPC Handlers

#### symphony.ts (main handler - 2949 lines)

- **Location**: `src/main/ipc/handlers/symphony.ts`
- **Purpose**: Main process business logic, GitHub API, git operations
- **Context**: `LOG_CONTEXT = '[Symphony]'` used for all logging

**Key IPC Handlers**:

##### `symphony:cloneRepo` (line 2262)

```typescript
Params: { repoUrl, localPath }
Returns: { success, error? }

Flow:
1. Validate GitHub URL
2. Ensure parent directory exists
3. Call cloneRepository() (shallow clone with depth=1)
4. Log success
```

**Debug Logging**:

```
logger.info('Repository cloned for Symphony session', LOG_CONTEXT, { localPath })
```

##### `symphony:startContribution` (line 2299)

```typescript
Params: {
  contributionId, sessionId, repoSlug, issueNumber, issueTitle,
  localPath, documentPaths
}
Returns: {
  success, branchName?, draftPrNumber?, draftPrUrl?,
  autoRunPath?, error?
}

Flow:
1. Validate inputs (slug, issue number, document paths)
2. Set up Auto Run folder path
3. Create and checkout new branch
4. Configure git user (Maestro Symphony / symphony@runmaestro.ai)
5. Create empty commit (enables branch push without changes)
6. Push branch to origin
7. Create draft PR on GitHub
8. Update symphony state
9. Return branch name, PR info, and Auto Run path
```

**Debug Logging**:

```
logger.info('Contribution started', LOG_CONTEXT, { ... })
logger.debug('Contribution already registered', LOG_CONTEXT, ...)
logger.error('Failed to create branch', LOG_CONTEXT, ...)
logger.error('Failed to push branch', LOG_CONTEXT, ...)
logger.error('Failed to create draft PR', LOG_CONTEXT, ...)
logger.info('Active contribution registered', LOG_CONTEXT, ...)
```

##### `symphony:registerActive` (line 1402)

```typescript
Registers contribution in persistent state so it appears in "Active" tab

Params: {
  contributionId, sessionId, repoSlug, repoName, issueNumber, issueTitle,
  localPath, branchName, totalDocuments, agentType,
  draftPrNumber?, draftPrUrl?
}

Updates SymphonyState:
- Adds to active[] array
- Broadcasts update via window.webContents.send('symphony:updated')
```

#### symphony.ts Supporting Functions

**Git Operations** (symphony-runner.ts delegated, but some in handler):

- `cloneRepository()` - Git clone with validation
- `createBranch()` - Git checkout -b
- `configureGitUser()` - Git config user.name/email
- `createEmptyCommit()` - Git commit --allow-empty
- `pushBranch()` - Git push -u origin
- `createDraftPR()` - GitHub CLI: gh pr create --draft

**Validation**:

- `validateGitHubUrl()` - HTTPS-only, github.com only
- `validateRepoSlug()` - Format: owner/repo
- `validateContributionParams()` - Full validation
- `sanitizeRepoName()` - Path traversal prevention

**Caching**:

- Registry cache (2 hours)
- Issues cache (5 minutes)
- Star counts cache (24 hours)

**Error Handling**:

```typescript
SymphonyError class with types:
- 'network'      // Network/fetch errors
- 'github_api'   // GitHub API errors
- 'git'          // Git operation errors
- 'parse'        // Document path parsing
- 'pr_creation'  // PR creation failed
- 'autorun'      // Auto Run execution
- 'cancelled'    // User cancelled
```

---

### 5. Application Integration (App.tsx)

#### onStartContribution Handler

- **Location**: `src/renderer/App.tsx` line 8820
- **Purpose**: Create Maestro session and register contribution

**Flow**:

```typescript
1. Get agent definition: window.maestro.agents.get(data.agentType)
2. Validate new session uniqueness
3. Generate session ID and initial tab ID
4. Check if git repo exists and get branches/tags
5. Create AITab object (initial tab)
6. Create Session object with:
   - symphonyMetadata containing:
     - isSymphonySession: true
     - contributionId
     - repoSlug, issueNumber, issueTitle
     - documentPaths array
     - status: 'running'
   - autoRunFolderPath (from contribution setup)
   - customPath, customArgs, customEnvVars (if specified)
7. Add session to sessions array
8. Register active contribution: window.maestro.symphony.registerActive()
9. Track stats: window.maestro.stats.recordSessionCreated()
10. Switch UI to Auto Run tab
11. Auto-start batch run with all contribution documents
```

**Debug Logging**:

```
console.log('[Symphony] Creating session for contribution:', data)
console.error(`Agent not found: ${data.agentType}`)
console.error(`Session validation failed: ${validation.error}`)
console.error('[Symphony] Failed to register active contribution:', err)
console.log('[Symphony] Auto-starting batch run with', documents.length, 'documents')
```

---

## Debug Logging & Error Handling

### Log Levels & Context

All Symphony logging uses the context `'[Symphony]'` for filtering.

**Typical Logging Pattern**:

```typescript
logger.info('Human-readable message', '[Symphony]', { contextData });
logger.warn('Warning message', '[Symphony]', { errorDetails });
logger.error('Error message', '[Symphony]', { cause, additionalData });
logger.debug('Debug message', '[Symphony]', { data });
```

### Key Logging Points

#### Registry Fetching (line 385-403):

```
logger.info('Fetching Symphony registry', '[Symphony]')
logger.info(`Fetched registry with ${data.repositories.length} repos`, '[Symphony]')
```

#### Issues Fetching (line 452-500):

```
logger.info(`Fetching issues for ${repoSlug}`, '[Symphony]')
logger.info(`Fetched ${issues.length} issues for ${repoSlug}`, '[Symphony]')
```

#### Contribution Start (line 1413+):

```
logger.info('Contribution started', '[Symphony]', {
  contributionId, repoSlug, issueNumber, localPath
})
logger.debug('Contribution already registered', '[Symphony]', { contributionId })
logger.info('Active contribution registered', '[Symphony]', {
  contributionId, repoSlug, branchName, prNumber
})
```

#### Git Operations (line 2300+):

```
logger.error('Failed to create branch', '[Symphony]', { branchName, error })
logger.error('Failed to configure git user', '[Symphony]', { error })
logger.error('Failed to push branch', '[Symphony]', { branchName, error })
```

#### PR Creation (line 2300+):

```
logger.error('Failed to create draft PR', '[Symphony]', {
  contributionId, issueNumber, error
})
logger.warn('PR creation failed, attempting to clean up', '[Symphony]')
```

#### Cancellation & Cleanup (line 1774):

```
logger.info('Contribution cancelled', '[Symphony]', { contributionId })
logger.warn('Failed to cleanup contribution directory', '[Symphony]', { error })
```

#### PR Status Checks (line 2006):

```
logger.info('PR merged detected', '[Symphony]', {
  contributionId, prNumber, mergedAt
})
logger.info('PR closed detected', '[Symphony]', {
  contributionId, prNumber
})
logger.info('PR status check complete', '[Symphony]', {
  checked, merged, closed, prInfoSynced
})
```

### Error Scenarios & Handling

#### 1. Agent Detection Failed

- **Trigger**: `AgentCreationDialog` fails to detect available agents
- **Error Message**: "Failed to detect available agents"
- **Logging**:
  ```
  console.error('Agent detection failed:', err)
  ```
- **UI**: Dialog shows error, blocks creation

#### 2. Repository URL Validation Failed

- **Trigger**: Invalid GitHub URL format
- **Validation**: HTTPS only, github.com only
- **Response**: `{ success: false, error: 'Only HTTPS URLs are allowed' }`

#### 3. Git Clone Failed

- **Trigger**: Repository doesn't exist or network error
- **Logging**: Via `cloneRepository()` function
- **Response**: `{ success: false, error: 'Clone failed: ...' }`

#### 4. Branch Creation Failed

- **Trigger**: Git config issue or permission problem
- **Logging**:
  ```
  logger.error('Failed to create branch', '[Symphony]', { branchName, error })
  ```
- **Response**: `{ success: false, error: 'Failed to create branch: ...' }`

#### 5. Draft PR Creation Failed

- **Trigger**: GitHub CLI not available or authentication issue
- **Logging**:
  ```
  logger.error('Failed to create draft PR', '[Symphony]', ...)
  logger.warn('PR creation failed, attempting to clean up remote branch', '[Symphony]')
  ```
- **Cleanup**: Attempts to delete remote branch
- **Response**: `{ success: false, error: 'Failed to create draft PR: ...' }`

#### 6. Session Creation Failed

- **Trigger**: Duplicate session name or path
- **Logging**:
  ```
  console.error(`Session validation failed: ${validation.error}`)
  ```
- **UI**: Toast error notification

#### 7. Contribution Registration Failed

- **Trigger**: IPC communication issue
- **Logging**:
  ```
  console.error('[Symphony] Failed to register active contribution:', err)
  ```
- **Impact**: Session created but doesn't appear in "Active" tab

---

## Type Definitions

### SymphonyTypes (src/shared/symphony-types.ts)

```typescript
// Issue representation
interface SymphonyIssue {
	number: number;
	title: string;
	body: string;
	url: string;
	htmlUrl: string;
	documentPaths: DocumentReference[]; // Parsed from issue body
	status: 'available' | 'in_progress' | 'completed';
	claimedByPr?: { number; url; author; isDraft };
	labels: SymphonyLabel[];
}

// Active contribution in progress
interface ActiveContribution {
	id: string; // Unique ID
	repoSlug: string; // owner/repo
	repoName: string;
	issueNumber: number;
	issueTitle: string;
	localPath: string; // Where repo is cloned
	branchName: string; // symphony/issue-{number}-{timestamp}
	sessionId: string; // Maestro session ID
	draftPrNumber?: number; // Set after first commit
	draftPrUrl?: string; // Set after first commit
	status: ContributionStatus; // cloning, running, completed, etc.
	progress: {
		totalDocuments: number;
		completedDocuments: number;
		currentDocument?: string;
		totalTasks: number;
		completedTasks: number;
	};
	tokenUsage: {
		inputTokens: number;
		outputTokens: number;
		estimatedCost: number;
	};
	timeSpent: number; // ms
	agentType: string; // e.g., 'claude-code'
	error?: string;
}

// Metadata attached to Session object
interface SymphonySessionMetadata {
	isSymphonySession: true;
	contributionId: string;
	repoSlug: string;
	issueNumber: number;
	issueTitle: string;
	documentPaths: string[];
	status: ContributionStatus;
	draftPrNumber?: number;
	draftPrUrl?: string;
}

// Contribution status lifecycle
type ContributionStatus =
	| 'cloning' // Cloning repository
	| 'creating_pr' // Creating draft PR
	| 'running' // Auto Run in progress
	| 'paused' // User paused
	| 'completed' // Auto Run finished
	| 'completing' // Pushing final changes
	| 'ready_for_review' // PR marked ready
	| 'failed' // Failed
	| 'cancelled'; // User cancelled
```

### Constants (src/shared/symphony-constants.ts)

```typescript
SYMPHONY_REGISTRY_URL =
	'https://raw.githubusercontent.com/RunMaestro/Maestro/main/symphony-registry.json';
GITHUB_API_BASE = 'https://api.github.com';
SYMPHONY_ISSUE_LABEL = 'runmaestro.ai';
SYMPHONY_BLOCKING_LABEL = 'blocking';

REGISTRY_CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
ISSUES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
STARS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

BRANCH_TEMPLATE = 'symphony/issue-{issue}-{timestamp}';
DRAFT_PR_TITLE_TEMPLATE = '[WIP] Symphony: {issue-title} (#{issue})';
```

---

## Data Persistence

### File Storage

```
~/Library/Application Support/Maestro/symphony/
├── symphony-cache.json          # Registry and issues cache
└── symphony-state.json          # Active and completed contributions
    └── symphony-repos/          # Cloned repositories
        └── {owner}-{repo}/      # e.g., RunMaestro-Maestro
```

### State Structure

```json
{
	"active": [
		// Array of ActiveContribution objects (in progress)
	],
	"history": [
		// Array of CompletedContribution objects (completed/merged/closed)
	],
	"stats": {
		// ContributorStats object (achievements, totals, streaks)
	}
}
```

---

## Real-Time Events

The main process broadcasts updates to the renderer process:

### `symphony:updated`

- **Broadcast**: After any contribution state change
- **Listener**: `useSymphony` hook debounces and refetches state (500ms)
- **Usage**: Keeps UI in sync with backend state

### `symphony:contributionStarted`

- **Broadcast**: When contribution begins
- **Data**: { contributionId, sessionId, localPath, branchName }
- **Usage**: Notify session layer of new contribution

### `symphony:prCreated`

- **Broadcast**: When draft PR is created
- **Data**: { contributionId, prNumber, prUrl }
- **Usage**: Update UI with PR link

### `symphony:prMerged` / `symphony:prClosed`

- **Broadcast**: When PR status changes on GitHub
- **Data**: { contributionId, prNumber }
- **Usage**: Move contribution to history

---

## Key Workflows

### Complete "Start Symphony" Flow

```
USER INTERACTION
├─ User clicks "Maestro Symphony" (Cmd+Shift+Y)
├─ SymphonyModal opens with Projects tab
├─ User selects repository → fetches issues
├─ User clicks "Start Symphony" on an issue
└─ AgentCreationDialog opens

AGENT SELECTION
├─ Detects available agents (supportsBatchMode=true only)
├─ User selects agent (e.g., claude-code)
├─ Pre-fills session name: "Symphony: owner/repo #123"
├─ Pre-fills working directory: "~/Maestro-Symphony/owner-repo"
├─ User clicks "Create Agent"
└─ handleCreateAgent() called

REPOSITORY CLONING
├─ startContribution() called
├─ IPC: window.maestro.symphony.cloneRepo()
├─ Main process: symphony:cloneRepo handler
├─ Git clone --depth=1 (shallow clone for speed)
├─ Logs: logger.info('Repository cloned for Symphony session')
└─ Returns success

CONTRIBUTION SETUP
├─ IPC: window.maestro.symphony.startContribution()
├─ Main process: symphony:startContribution handler
├─ Create branch: git checkout -b symphony/issue-{N}-{timestamp}
├─ Configure git: git config user.name "Maestro Symphony"
├─ Create empty commit: git commit --allow-empty
├─ Push branch: git push -u origin symphony/issue-{N}-{timestamp}
├─ Create draft PR: gh pr create --draft
├─ Update symphony state in persistent storage
├─ Logs: Multiple logger.info() calls for each step
└─ Returns: { branchName, draftPrNumber, draftPrUrl, autoRunPath }

SESSION CREATION
├─ App.tsx: onStartContribution() handler
├─ Validate agent exists: window.maestro.agents.get()
├─ Validate session uniqueness
├─ Create Session object with symphonyMetadata
├─ Add to sessions array
├─ IPC: window.maestro.symphony.registerActive()
├─ Register in persistent state
├─ Track stats: window.maestro.stats.recordSessionCreated()
├─ Logs: console.log('[Symphony] Creating session for contribution:', data)
└─ Switch to Auto Run tab

AUTO RUN BATCH START
├─ Create BatchRunConfig with all contribution documents
├─ Trigger batch run: AUTO_RUN_FEATURE.startBatchRun()
├─ Logs: console.log('[Symphony] Auto-starting batch run with X documents')
└─ Agent begins processing documents automatically

MONITORING
├─ useContribution hook polls every 2 seconds
├─ Updates progress, token usage, elapsed time
├─ Real-time: symphony:updated broadcast triggers UI refresh
└─ User sees documents being processed in Auto Run tab
```

### Keyboard Shortcuts

- `Cmd+Shift+Y` / `Ctrl+Shift+Y` - Open/toggle Symphony modal
- `/` - Focus search in projects
- Arrow keys - Navigate projects
- Enter - Select project
- `Cmd+Shift+[` / `Cmd+Shift+]` - Cycle through document previews

---

## Testing

Located in `src/__tests__/`

- `integration/symphony.integration.test.ts` - End-to-end tests
- `main/ipc/handlers/symphony.test.ts` - Handler unit tests
- `main/services/symphony-runner.test.ts` - Runner service tests
- `shared/symphony-types.test.ts` - Type validation tests
- `shared/symphony-constants.test.ts` - Constants tests

Run with:

```bash
npm run test -- symphony
npm run test:integration -- symphony
```

---

## Configuration & Environment

### Required Tools

1. **Git** - For cloning and branch operations
2. **GitHub CLI (`gh`)** - For PR creation and management
3. **Build tools** - Project-specific (Node.js, Python, Rust, etc.)

### GitHub Authentication

- GitHub CLI must be authenticated: `gh auth login`
- Symphony verifies this before allowing contributions

### Preferences (via Settings)

- Default Symphony working directory
- Auto-start batch run (default: enabled)
- Symphony group in left bar (optional)

---

## Security Considerations

### Input Validation

- Repository URLs: HTTPS-only, github.com only
- Repository slugs: Format validation (owner/repo)
- Document paths: No path traversal (.., /), external URLs restricted to GitHub
- File downloads: HTTPS-only, GitHub domains only

### Path Traversal Prevention

- `sanitizeRepoName()` removes unsafe characters
- Repository paths cannot contain .. or start with /
- External document URLs validated against GitHub domains

### Git Configuration

- Sets local git user (Maestro Symphony / symphony@runmaestro.ai)
- Prevents signing prompts in CI-like environments

### Process Execution

- Git/GitHub CLI executed via `execFileNoThrow()` for safety
- No shell injection vectors (arguments passed as arrays)

---

## Performance Optimizations

### Caching Strategy

- Registry: 2 hours (rarely changes, maintained by Maestro)
- Issues: 5 minutes (change frequently)
- Star counts: 24 hours (change slowly)

### Repository Cloning

- Shallow clone (`--depth=1`) for speed
- Reduces network bandwidth and local storage

### Batch Processing

- All documents run in sequence via Auto Run
- Single agent session handles all tasks
- Progress tracking every step

### Real-Time Updates

- Debounced state refresh (500ms)
- Event-driven updates via IPC
- Periodic sync (2 minutes) as fallback

---

## Summary

The Maestro Symphony feature integrates seamlessly with Maestro's session management:

1. **UI Layer** (SymphonyModal + AgentCreationDialog) - Browse projects, issues, select agent
2. **Logic Layer** (useSymphony + useContribution hooks) - Manage state, fetch data, validate
3. **IPC Layer** (preload bridge) - Secure communication between processes
4. **Main Layer** (symphony.ts handler) - GitHub API, git operations, state persistence
5. **Integration** (App.tsx) - Create Maestro session, register contribution, auto-start batch

When user clicks "Start Symphony", the system creates a complete contribution workflow with dedicated agent session, cloned repository, git branch, draft PR, and Auto Run documents—all tracked in persistent state and accessible from the "Active" tab.

All major operations are logged with `[Symphony]` context for easy filtering and debugging. Error handling gracefully reports issues to the user via toast notifications or dialog messages.
