# Symphony Feature - Quick Reference Guide

## 📁 Key Files & Line Numbers

### Core Types & Constants

| File                               | Purpose          | Key Sections                                                                           |
| ---------------------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| `src/shared/symphony-types.ts`     | Type definitions | `SymphonyIssue`, `ActiveContribution`, `SymphonySessionMetadata`, `ContributionStatus` |
| `src/shared/symphony-constants.ts` | Constants & URLs | `SYMPHONY_REGISTRY_URL`, cache TTLs, branch templates, PR templates                    |

### Renderer Components

| File                                              | Purpose                      | Key Functions                                                                |
| ------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `src/renderer/components/SymphonyModal.tsx`       | Main modal UI (4 tabs)       | Line 951: "Start Symphony" button, Line 1490: handleStartContribution        |
| `src/renderer/components/AgentCreationDialog.tsx` | Agent selection dialog       | Line 104: symphonyAgentFilter, Line 142: Agent detection                     |
| `src/renderer/App.tsx`                            | Session creation integration | Line 8820: onStartContribution handler (creates session + auto-starts batch) |

### Renderer Hooks

| File                                             | Purpose                      | Key Functions                                                                    |
| ------------------------------------------------ | ---------------------------- | -------------------------------------------------------------------------------- |
| `src/renderer/hooks/symphony/useSymphony.ts`     | State management             | Line 159: fetchRegistry, Line 244: selectRepository, Line 275: startContribution |
| `src/renderer/hooks/symphony/useContribution.ts` | Single contribution tracking | Line 60: fetchContribution (2s polling), Line 132: updateProgress                |

### Main Process

| File                                   | Purpose             | Lines | Key Handlers                                                                  |
| -------------------------------------- | ------------------- | ----- | ----------------------------------------------------------------------------- |
| `src/main/ipc/handlers/symphony.ts`    | IPC handlers        | 2949  | Line 2262: cloneRepo, Line 2299: startContribution, Line 1402: registerActive |
| `src/main/preload/symphony.ts`         | IPC bridge          | —     | createSymphonyApi() exports all Symphony methods                              |
| `src/main/services/symphony-runner.ts` | Git & PR operations | —     | cloneRepo, createBranch, createDraftPR, etc.                                  |

### Documentation

| File                   | Purpose                             |
| ---------------------- | ----------------------------------- |
| `docs/symphony.md`     | User documentation                  |
| `SYMPHONY_ISSUES.md`   | How to create Symphony-ready issues |
| `SYMPHONY_REGISTRY.md` | Registry management                 |

---

## 🔄 Complete Call Chain: "Start Symphony" Button Click

```
1. User clicks "Start Symphony" button (SymphonyModal.tsx:951)
   └─ handleStartContribution() (line 1490)
       └─ setShowAgentDialog(true)

2. AgentCreationDialog opens
   └─ window.maestro.agents.detect() [IPC]
   └─ User selects agent and confirms

3. handleCreateAgent() called (line 1494)
   └─ startContribution() [useSymphony hook, line 275]
       ├─ Generate contributionId
       ├─ window.maestro.symphony.cloneRepo() [IPC]
       │  └─ Main: symphony:cloneRepo handler (line 2262)
       │     └─ git clone --depth=1
       │     └─ logger.info('Repository cloned...')
       │
       └─ window.maestro.symphony.startContribution() [IPC]
          └─ Main: symphony:startContribution handler (line 2299)
             ├─ git checkout -b symphony/issue-{N}-{timestamp}
             ├─ git config user.name/email
             ├─ git commit --allow-empty
             ├─ git push -u origin
             ├─ gh pr create --draft
             ├─ Update symphony-state.json
             ├─ Broadcast: symphony:updated
             └─ Return { branchName, draftPrNumber, draftPrUrl, autoRunPath }

4. onStartContribution() callback (App.tsx:8820)
   ├─ Get agent: window.maestro.agents.get(agentType)
   ├─ Validate session uniqueness
   ├─ Create Session object with symphonyMetadata
   ├─ setSessions([...prev, newSession])
   ├─ window.maestro.symphony.registerActive() [IPC]
   │  └─ Main: symphony:registerActive handler (line 1402)
   │     ├─ Update active[] in symphony-state.json
   │     └─ Broadcast: symphony:updated
   │
   ├─ window.maestro.stats.recordSessionCreated()
   ├─ Switch UI to Auto Run tab
   └─ Auto-start batch run with all documents

5. Auto Run Batch Begins
   ├─ Process each document sequentially
   └─ Track progress via window.maestro.symphony.updateStatus() [IPC]
```

---

## 🐛 Debug Logging: Search & Filter

### In VS Code Terminal

```bash
# Show all Symphony logs
npm run dev 2>&1 | grep "\[Symphony\]"

# Show errors only
npm run dev 2>&1 | grep -E "\[Symphony\].*error|Error"

# With context (3 lines before/after)
npm run dev 2>&1 | grep -A3 -B3 "Failed"
```

### In DevTools Console (Renderer)

```javascript
// Listen for Symphony updates
window.maestro.symphony.onUpdated(() => console.log('Symphony updated'));

// Fetch current state
window.maestro.symphony.getState().then((r) => console.log(r));

// Check active contributions
window.maestro.symphony.getActive().then((r) => console.log(r));
```

### Main Process Logger Output

```
2024-01-15 14:23:45 [Symphony] Fetching Symphony registry
2024-01-15 14:23:46 [Symphony] Fetched registry with 42 repos
2024-01-15 14:23:50 [Symphony] Cloning repository...
2024-01-15 14:23:51 [Symphony] Repository cloned for Symphony session
2024-01-15 14:23:52 [Symphony] Contribution started
2024-01-15 14:23:53 [Symphony] Active contribution registered
```

---

## ⚠️ Common Error Points & Troubleshooting

### 1. Agent Detection Fails

**Symptom**: "Failed to detect available agents"
**Cause**: `window.maestro.agents.detect()` fails
**Check**:

```javascript
// In DevTools
window.maestro.agents.detect().then((a) => console.log(a));
```

**Log**: Search for "Agent detection failed"

### 2. Repository Clone Fails

**Symptom**: Dialog closes but no session created
**Cause**: Network error or invalid URL
**Check**: Git is installed, URL is HTTPS, network access
**Log**: `[Symphony] Cloning repository...` followed by error

### 3. Git Operations Fail

**Symptom**: Contribution in "failed" state
**Cause**: Git not configured, permission issue, or corrupt repo
**Check**: Manual `git` commands work in that directory
**Log**: `[Symphony] Failed to create branch...` or similar

### 4. PR Creation Fails

**Symptom**: Contribution exists but no PR link
**Cause**: GitHub CLI not installed or not authenticated
**Check**: `gh auth status` returns authenticated
**Log**: `[Symphony] Failed to create draft PR...`

### 5. Session Creation Fails

**Symptom**: Agent dialog completes but no session in left bar
**Cause**: Duplicate session name or path collision
**Check**: No existing session with same name/path
**Log**: Search for "validation failed" in console

### 6. Contribution Doesn't Show in "Active" Tab

**Symptom**: Session created but not in Symphony modal
**Cause**: `registerActive()` failed or state not persisted
**Check**: Check `~/.maestro/symphony/symphony-state.json`
**Log**: `[Symphony] Failed to register active contribution...`

---

## 🔍 State Files Location

```
~/.maestro/symphony/
├── symphony-state.json          # ActiveContribution & history
├── symphony-cache.json          # Registry & issues cache
└── symphony-repos/
    └── {owner}-{repo}/          # Cloned repositories
```

### Inspect State

```bash
# View active contributions
cat ~/.maestro/symphony/symphony-state.json | jq '.active'

# View contribution history
cat ~/.maestro/symphony/symphony-state.json | jq '.history'

# View stats
cat ~/.maestro/symphony/symphony-state.json | jq '.stats'
```

---

## 🧪 Testing the Feature

### Manual Test Checklist

- [ ] Open Symphony modal (Cmd+Shift+Y)
- [ ] Verify registry loads
- [ ] Search/filter projects works
- [ ] Select a repository
- [ ] Verify issues load
- [ ] Click "Start Symphony" on an issue
- [ ] Agent dialog shows compatible agents
- [ ] Pre-filled values correct (session name, path)
- [ ] Select agent and confirm
- [ ] Verify session created in left bar
- [ ] Verify Auto Run tab shows documents
- [ ] Verify batch run starts automatically
- [ ] Monitor progress in "Active" tab
- [ ] Check Symphony modal "Active" tab shows contribution
- [ ] Verify PR link appears in "Active" tab
- [ ] Complete contribution and verify moves to "History"

### Automated Tests

```bash
# Run all tests
npm run test

# Run Symphony tests only
npm run test -- symphony

# Run integration tests
npm run test:integration -- symphony

# Watch mode
npm run test -- --watch symphony
```

---

## 📊 Key Metrics & Monitoring

### Performance

- **Registry fetch**: Should be <1s (cached 2h)
- **Issues fetch**: Should be <2s per repo (cached 5m)
- **Clone speed**: Depends on repo size (shallow clone used)
- **Branch creation**: <1s
- **PR creation**: 1-3s (GitHub API + CLI)

### Success Metrics

```typescript
// Tracked in symphony-state.json
-totalContributions - // PRs created
	totalMerged - // PRs merged
	totalDocumentsProcessed -
	totalTasksCompleted -
	totalTokensUsed -
	estimatedCostDonated;
```

### Achievements Unlocked

- "First Steps" - Complete first contribution
- "Merged Melody" - First PR merged
- "Weekly Rhythm" - 7-day contribution streak
- "Harmony Seeker" - 10 contributions
- "Ensemble Player" - 5 different repos
- "Virtuoso" - 1000 tasks completed
- "Token Millionaire" - 10M tokens donated
- "Early Adopter" - Joined in first month

---

## 🔐 Security Considerations

### URL Validation

- ✅ GitHub URLs only (github.com)
- ✅ HTTPS required
- ✅ External document URLs limited to GitHub domains
- ❌ No path traversal (.. or leading /)

### Path Sanitization

- ✅ Repository names sanitized
- ✅ No directory traversal possible
- ✅ Paths limited to 100 chars

### Process Execution

- ✅ git/gh executed via `execFileNoThrow()` (not shell)
- ✅ Arguments passed as arrays (no injection)
- ✅ No user input passed to shell

---

## 🚀 Performance Optimizations

| Optimization      | Where                      | Benefit                     |
| ----------------- | -------------------------- | --------------------------- |
| Shallow clone     | cloneRepository()          | ~50% faster, less bandwidth |
| Caching           | Registry (2h), Issues (5m) | Reduce GitHub API calls     |
| Batch processing  | Auto Run                   | Single session for all docs |
| Debounced updates | useSymphony hook           | Reduce re-renders (500ms)   |
| Event-driven sync | symphony:updated broadcast | Real-time without polling   |
| Lazy loading      | SymphonyModal components   | Faster modal open           |

---

## 📚 Additional Resources

- [User Docs](./docs/symphony.md)
- [Creating Symphony Issues](./SYMPHONY_ISSUES.md)
- [Registry Management](./SYMPHONY_REGISTRY.md)
- [Code Structure Deep Dive](./SYMPHONY_CODE_STRUCTURE.md)
- [Flow Diagrams](./SYMPHONY_FLOW_DIAGRAMS.md)

---

## 💡 Tips for Developers

### Adding New Features

1. Update types in `src/shared/symphony-types.ts`
2. Update constants in `src/shared/symphony-constants.ts`
3. Add handler in `src/main/ipc/handlers/symphony.ts`
4. Add preload method in `src/main/preload/symphony.ts`
5. Use hook in renderer component
6. Test with `npm run test`
7. Add logging with `logger.[level]('[Symphony]', ...)`

### Debugging Tips

1. Use `LOG_CONTEXT = '[Symphony]'` for consistent filtering
2. Add `logger.debug()` calls in hot paths
3. Use `console.log('[Symphony] ...')` in renderer for UI state
4. Check `~/.maestro/symphony/symphony-state.json` for state
5. Monitor `symphony:updated` broadcasts in DevTools

### Common Gotchas

1. Remember to call `ensureSymphonyDir()` before file I/O
2. Always validate inputs before git operations
3. Broadcast `symphony:updated` after state changes
4. Use async/await properly in IPC handlers
5. Clean up subscriptions in React hooks (return unsubscribe fn)

---

**Last Updated**: 2024-02-18  
**Version**: 1.0  
**Maintainers**: RunMaestro Team
