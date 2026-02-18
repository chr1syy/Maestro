# Symphony Feature - Complete Event & Call Flow Diagrams

## 1. User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ USER CLICKS "MAESTRO SYMPHONY" (Cmd+Shift+Y)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ SymphonyModal Opens (SymphonyModal.tsx)                         │
│ - Projects tab selected by default                              │
│ - Fetches registry via useSymphony hook                         │
│   └─ IPC: window.maestro.symphony.getRegistry()                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    BROWSE &           SELECT              CLICK
    SEARCH             REPOSITORY          "START
    PROJECTS           (handleSelectRepo)  SYMPHONY"
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ selectRepository() Fetches Issues                              │
│ IPC: window.maestro.symphony.getIssues(repoSlug)               │
│ - GitHub API: /repos/{owner}/{repo}/issues?labels=runmaestro.ai
│ - Parse document paths from issue body                          │
│ - Enrich with PR status (if already claimed)                    │
│ - Cache: 5 minutes TTL                                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Issues List Displayed                                           │
│ User selects an issue & clicks "Start Symphony" button         │
│ (line 951 in SymphonyModal.tsx)                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ handleStartContribution() Called (line 1490)                    │
│ - Set selectedIssue                                             │
│ - setShowAgentDialog(true)                                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ AgentCreationDialog Opens (AgentCreationDialog.tsx)             │
│ - Detects available agents                                      │
│   └─ IPC: window.maestro.agents.detect()                       │
│ - Filters: only batch-mode capable agents                       │
│ - Pre-fills session name: "Symphony: owner/repo #123"          │
│ - Pre-fills working directory: "~/Maestro-Symphony/owner-repo" │
│ - Auto-selects first compatible agent                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    OPTIONAL:          USER CONFIRMS    USER CANCELS
    CUSTOMIZE          AGENT              │
    SETTINGS           SELECTION      setShowAgentDialog(false)
        │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ handleCreateAgent() Called (line 1494 in SymphonyModal.tsx)    │
│ - startContribution() invoked with:                             │
│   { repo, issue, agentType, workingDirectory }                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
         CONTRIBUTION STARTUP SEQUENCE (see section 2)
```

---

## 2. Contribution Startup Sequence

```
┌──────────────────────────────────────────────────────────────────┐
│ startContribution() Called in useSymphony Hook                   │
│ (src/renderer/hooks/symphony/useSymphony.ts, line 275)          │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ├─ Generate contributionId
                   │   └─ timestamp + random = contrib_1a2b3c_xyz123
                   │
                   ├─ Determine localPath
                   │   └─ workingDirectory || `/tmp/symphony/{repo}`
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: Clone Repository                                         │
├──────────────────────────────────────────────────────────────────┤
│ IPC: window.maestro.symphony.cloneRepo({                        │
│   repoUrl: "https://github.com/owner/repo.git",                 │
│   localPath: "~/Maestro-Symphony/owner-repo"                    │
│ })                                                               │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
         MAIN PROCESS: symphony:cloneRepo handler
         (symphony.ts, line 2262)
         │
         ├─ Validate GitHub URL
         ├─ Ensure parent directory exists
         ├─ Call cloneRepository()
         │   └─ git clone --depth=1 repoUrl localPath
         ├─ Log: logger.info('Repository cloned for Symphony session')
         └─ Return: { success: true }
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: Start Contribution (Setup Branch, Create PR)            │
├──────────────────────────────────────────────────────────────────┤
│ IPC: window.maestro.symphony.startContribution({                │
│   contributionId, sessionId, repoSlug, issueNumber, issueTitle, │
│   localPath, documentPaths                                      │
│ })                                                               │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
         MAIN PROCESS: symphony:startContribution handler
         (symphony.ts, line 2299)
         │
         ├─ Validate all inputs (slug, issue number, doc paths)
         │
         ├─ Setup Auto Run folder
         │   └─ Copy external documents to ~/.maestro/symphony-cache/
         │   └─ Reference repo-local documents by path
         │
         ├─ Git operations in localPath:
         │   ├─ git checkout -b symphony/issue-{N}-{timestamp}
         │   │  └─ Log: logger.error('Failed to create branch') on error
         │   │
         │   ├─ git config user.name "Maestro Symphony"
         │   ├─ git config user.email "symphony@runmaestro.ai"
         │   │  └─ Log: logger.warn('Failed to set git user.name') on error
         │   │
         │   ├─ git commit --allow-empty -m "Start Symphony contribution"
         │   │  └─ Log: logger.warn('Failed to create empty commit') on error
         │   │
         │   └─ git push -u origin symphony/issue-{N}-{timestamp}
         │      └─ Log: logger.error('Failed to push branch') on error
         │
         ├─ Create Draft PR:
         │   └─ gh pr create --draft --title "[WIP] Symphony: ..." \
         │                    --body "Closes #{issue}"
         │   └─ Log: logger.error('Failed to create draft PR') on error
         │   └─ If fails: logger.warn('PR creation failed, attempting cleanup')
         │      └─ Attempts: git push --delete origin symphony/...
         │
         ├─ Update Symphony state:
         │   ├─ Read current state from symphony-state.json
         │   ├─ Update active contribution record
         │   ├─ Write back to disk
         │   └─ Broadcast: mainWindow?.webContents.send('symphony:updated')
         │
         ├─ Log: logger.info('Active contribution registered')
         │
         └─ Return: {
              success: true,
              branchName: "symphony/issue-123-1a2b3c",
              draftPrNumber: 456,
              draftPrUrl: "https://github.com/owner/repo/pull/456",
              autoRunPath: "/path/to/autorun/folder"
            }
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 3: Register Active Contribution                             │
├──────────────────────────────────────────────────────────────────┤
│ Back in useSymphony.startContribution():                         │
│ - Return result to SymphonyModal.handleCreateAgent()            │
│ - onStartContribution() callback invoked with full data         │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
         APP.TSX: onStartContribution Handler (line 8820)
         │
         ├─ Get agent: window.maestro.agents.get(agentType)
         │  └─ Log error if not found
         │
         ├─ Validate session uniqueness
         │  └─ Log error if duplicate
         │
         ├─ Generate IDs:
         │   ├─ sessionId = generateId()
         │   └─ initialTabId = generateId()
         │
         ├─ Check git status:
         │   ├─ gitService.isRepo(localPath)
         │   ├─ gitService.getBranches()
         │   └─ gitService.getTags()
         │
         ├─ Create AITab object
         │
         ├─ Create Session object with symphonyMetadata:
         │   {
         │     isSymphonySession: true,
         │     contributionId,
         │     repoSlug, issueNumber, issueTitle,
         │     documentPaths: issue.documentPaths.map(d => d.path),
         │     status: 'running'
         │   }
         │
         ├─ Add to sessions array: setSessions([...prev, newSession])
         │  └─ Log: console.log('[Symphony] Creating session:', data)
         │
         ├─ Register in Symphony persistent state:
         │   IPC: window.maestro.symphony.registerActive({
         │     contributionId, sessionId, repoSlug, repoName,
         │     issueNumber, issueTitle, localPath, branchName,
         │     totalDocuments, agentType, draftPrNumber, draftPrUrl
         │   })
         │  └─ Log: logger.info('Active contribution registered') in main
         │
         ├─ Record stats:
         │   window.maestro.stats.recordSessionCreated({...})
         │
         ├─ Set active session and UI focus
         │
         ├─ Switch to Auto Run tab: setActiveRightTab('autorun')
         │
         └─ Auto-start batch run (next section)
                   │
                   ▼
```

---

## 3. Auto Run Batch Start

```
┌──────────────────────────────────────────────────────────────────┐
│ Auto-Start Batch Run (App.tsx, line 8990)                       │
├──────────────────────────────────────────────────────────────────┤
│ Small delay (setTimeout 0) to ensure session state propagated  │
│                                                                  │
│ Create BatchRunConfig:                                          │
│   documents: issue.documentPaths.map(doc => ({                 │
│     id: generateId(),                                           │
│     filename: doc.name.replace(/\.md$/, ''),                   │
│     resetOnCompletion: false                                    │
│   })),                                                          │
│   prompt: DEFAULT_BATCH_PROMPT,                                │
│   loopEnabled: false                                            │
│                                                                  │
│ Trigger: AUTO_RUN_FEATURE.startBatchRun()                      │
│                                                                  │
│ Log: console.log('[Symphony] Auto-starting batch run with N docs')
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
         BATCH RUN BEGINS
         │
         ├─ Process each document sequentially
         │   ├─ Load document from Auto Run path
         │   ├─ Parse checkboxes
         │   ├─ Send to agent for processing
         │   ├─ Track progress
         │   └─ Update Symphony state:
         │       └─ IPC: window.maestro.symphony.updateStatus({
         │             contributionId,
         │             progress: { completedDocuments++ }
         │           })
         │
         ├─ Token tracking:
         │   └─ Update after each document:
         │       IPC: window.maestro.symphony.updateStatus({
         │             tokenUsage: { inputTokens, outputTokens, cost }
         │           })
         │
         └─ On first commit detected:
             └─ Main process creates draft PR (deferred PR creation)
                └─ Log: logger.info('Discovered existing PR from branch')
                        or logger.info('PR merged detected')
```

---

## 4. Real-Time Monitoring & Updates

```
┌──────────────────────────────────────────────────────────────────┐
│ Real-Time Update Flow                                            │
└──────────────────┬───────────────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
EVENT: STATE    EVENT: PR      PERIODIC:
CHANGE (every   CREATED (once) AUTO-SYNC
0.5s debounce)             (every 2min)
    │              │              │
    ├──────────────┼──────────────┤
    │              │              │
    ▼              ▼              ▼
Main: symphony:updated
│
├─ Broadcast: mainWindow?.webContents.send('symphony:updated')
│
▼
Renderer: onUpdated() event listener (useSymphony hook, line 203)
│
├─ Debounce 500ms (prevent excessive updates)
├─ fetchSymphonyState()
│   └─ IPC: window.maestro.symphony.getState()
│
├─ Update activeContributions array
│
└─ UI components re-render with new data:
   ├─ ActiveContributionCard
   │   ├─ Progress bar (documents, tasks)
   │   ├─ Token usage
   │   ├─ Elapsed time
   │   ├─ Current document
   │   └─ PR link (if created)
   │
   └─ useContribution hook (per-contribution):
       ├─ Poll every 2 seconds while running
       ├─ Calculate elapsedTime from startedAt
       └─ Update UI elements
```

---

## 5. Completion Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ Auto Run Batch Completes                                         │
├──────────────────────────────────────────────────────────────────┤
│ All documents processed                                          │
│ Contribution status: 'completed' or 'failed'                    │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ User Clicks "Finalize PR"                                        │
│ (or system auto-finalizes on completion)                        │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
         IPC: window.maestro.symphony.complete({
           contributionId,
           prBody: "Final PR body with stats"
         })
         │
         ▼
         Main: symphony:complete handler (symphony.ts, line 1690)
         │
         ├─ Find active contribution
         ├─ Update PR body with final stats:
         │   └─ gh pr edit --body "..."
         │
         ├─ Mark PR as ready for review:
         │   └─ gh pr ready (convert from draft to ready)
         │
         ├─ Move contribution to history
         ├─ Update stats (merged count, etc.)
         │
         ├─ Log: logger.info('Contribution completed')
         │
         └─ Broadcast: symphony:updated
                   │
                   ▼
         Renderer: Contribution moves to History tab
         │
         ├─ Removed from Active
         ├─ Added to Completed/History
         └─ User can see:
             ├─ PR link
             ├─ Documents processed
             ├─ Tasks completed
             ├─ Tokens used
             └─ Time spent
```

---

## 6. Error Recovery Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ Error Occurs During Contribution                                 │
└──────────────────┬───────────────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
CLONE      BRANCH         PR
FAILS      CREATION       CREATION
   │       FAILS          FAILS
   │          │              │
   │          ▼              ▼
   │   Logger: Failed to   Logger: Failed to
   │   create branch       create draft PR
   │   Log Context: [S]    [S]
   │   │                   │
   │   └──────────┬────────┘
   │              │
   ▼              ▼
Update Contribution Status:
│
├─ status = 'failed'
├─ error = error message
├─ Log: logger.error('...', '[Symphony]', { cause })
│
├─ Broadcast: symphony:updated
│
▼
Renderer UI Shows:
│
├─ Status badge: "Failed" (red)
├─ Error message visible
├─ Cancel button enabled
└─ User can:
   ├─ Cancel and cleanup
   ├─ Retry (if applicable)
   └─ Delete session
```

---

## 7. GitHub PR Status Sync Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ Check PR Statuses (Periodic or Manual)                           │
│ IPC: window.maestro.symphony.checkPRStatuses()                  │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
         Main: symphony:checkPRStatuses handler
         │
         ├─ For each active contribution:
         │   │
         │   ├─ If draftPrNumber exists:
         │   │   └─ Fetch PR from GitHub API
         │   │       ├─ Check if merged
         │   │       ├─ Check if closed
         │   │       └─ Update status
         │   │
         │   ├─ If no PR yet, try to discover by branch:
         │   │   └─ Query GitHub API for PRs with branch
         │   │       └─ Log: logger.info('Discovered PR from branch')
         │   │
         │   └─ Update contribution record if status changed
         │       ├─ Merge detected:
         │       │   └─ Log: logger.info('PR merged detected')
         │       │   └─ Move to history, mark wasMerged: true
         │       │
         │       └─ Close detected:
         │           └─ Log: logger.info('PR closed detected')
         │           └─ Move to history, mark wasClosed: true
         │
         ├─ Save updated state
         ├─ Broadcast: symphony:updated
         │
         └─ Return: {
              success: true,
              checked: N,     // PRs checked
              merged: M,      // PRs merged
              closed: C,      // PRs closed
              errors: []
            }
                   │
                   ▼
         Renderer: Update achievements & stats
         │
         ├─ Recalculate stats
         ├─ Check for achievements:
         │   ├─ "First Steps" (1st contribution)
         │   ├─ "Merged Melody" (1st merged)
         │   ├─ "Virtuoso" (1000 tasks)
         │   ├─ "Token Millionaire" (10M tokens)
         │   └─ etc.
         │
         └─ Show unlock notifications
```

---

## 8. Complete State Transitions

```
Contribution Lifecycle:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  'cloning'  →  'creating_pr'  →  'running'  →  'completed'    │
│                                      ↓                          │
│                                   'paused' ↔ 'running'          │
│                                                                  │
│  [Any state] → 'failed'                                         │
│  [Any state] → 'cancelled'                                      │
│                                                                  │
│  'completed' → 'completing' → 'ready_for_review'               │
│                                                                  │
│  [Final states]: 'ready_for_review', 'failed', 'cancelled'     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Session Lifecycle (within single session):
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  create → idle → running → paused → running → completed        │
│                                                                  │
│  symphonyMetadata.status tracks contribution status             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. Console Logging Points (For Debugging)

### Renderer Process Logs

```
[Symphony] Creating session for contribution: {...}
[Symphony] Auto-starting batch run with N documents
[Symphony] Failed to register active contribution: ...
Agent detection failed: ...
Failed to fetch registry: ...
Failed to fetch issues: ...
```

### Main Process Logs

```
[Symphony] Fetching Symphony registry
[Symphony] Fetched registry with N repos
[Symphony] Fetching issues for owner/repo
[Symphony] Fetched N issues for owner/repo
[Symphony] Cloning repository...
[Symphony] Repository cloned for Symphony session
[Symphony] Contribution started
[Symphony] Failed to create branch...
[Symphony] Failed to create draft PR...
[Symphony] Active contribution registered
[Symphony] PR merged detected
[Symphony] PR status check complete
```

### Search Filter (in DevTools or log viewer)

```
Filter: "[Symphony]"
Verbosity: debug, info, warn, error
```

---

## 10. Data Flow Diagram (Simplified)

```
RENDERER                         IPC BRIDGE                  MAIN PROCESS
─────────────────────────────────────────────────────────────────────────

SymphonyModal
    ├─ useSymphony (hook)
    │  └─ state: registry, issues, contributions
    │     └─ fetchRegistry() ────────────────────> symphony:getRegistry
    │     └─ selectRepository() ────────────────> symphony:getIssues
    │     └─ startContribution() ──────────────> symphony:cloneRepo
    │                                           └──> git clone
    │                                           └──> symphony:startContribution
    │                                               ├──> git branch/commit/push
    │                                               └──> gh pr create
    │                                           └──> symphony:registerActive
    │
    ├─ AgentCreationDialog
    │  └─ window.maestro.agents.detect() ───────> agents:detect
    │  └─ Onsubmit: handleCreateAgent()
    │     └─ calls useSymphony.startContribution()
    │
    └─ onStartContribution callback (App.tsx)
       ├─ Creates Session object with symphonyMetadata
       ├─ window.maestro.symphony.registerActive()
       └─ Starts batch Auto Run

PERSISTENT STATE
     ├─ ~/.maestro/symphony/symphony-state.json
     │  └─ { active: [...], history: [...], stats: {...} }
     │
     └─ ~/.maestro/symphony/symphony-cache.json
        └─ { registry: {...}, issues: {...}, stars: {...} }
```

---

This comprehensive flow documentation should help understand the complete "Start Symphony" → "New Agent" journey through the codebase!
