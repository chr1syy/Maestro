# Maestro Symphony Feature - Complete Documentation Index

## 📖 Documentation Overview

This comprehensive guide covers the **Maestro Symphony feature** - a community-driven program that connects users with open source projects seeking AI-assisted contributions. The documentation focuses on the **"New Agent" creation flow** when users click "Start Symphony" from the runmaestro modal.

---

## 📚 Documentation Files

### 1. **SYMPHONY_QUICK_REFERENCE.md** ⭐ START HERE

**Best for**: Quick lookup, debugging, common issues  
**Contains**:

- File locations & line numbers
- Complete call chain for "Start Symphony"
- Debug logging search tips
- Common error troubleshooting
- State file locations
- Performance metrics
- Security considerations
- Testing checklist

**Start here if you need to**: Find something fast, understand the overall flow, debug an issue

---

### 2. **SYMPHONY_CODE_STRUCTURE.md**

**Best for**: Understanding architecture & code organization  
**Contains**:

- Complete file structure
- Data flow between renderer/main/IPC layers
- Business logic in hooks
- IPC bridge architecture
- Application integration (App.tsx)
- Type definitions
- Data persistence
- Real-time event system
- Detailed workflow descriptions
- Type definitions reference
- Error scenarios & handling

**Start here if you need to**: Understand how components interact, modify code, add features

---

### 3. **SYMPHONY_FLOW_DIAGRAMS.md**

**Best for**: Visual learners, understanding execution flow  
**Contains**:

- User interaction flow (step-by-step)
- Contribution startup sequence with all git operations
- Auto Run batch start process
- Real-time monitoring & updates
- Completion flow
- Error recovery flow
- GitHub PR status sync
- State transitions
- Console logging points
- Complete data flow diagram

**Start here if you need to**: Visualize the process, trace execution path, understand timing

---

### 4. **SYMPHONY_CODE_STRUCTURE.md** (Comprehensive Reference)

**Already covered above** - Provides the detailed deep dive

---

### 5. **docs/symphony.md**

**Best for**: End-user documentation  
**Contains**:

- User prerequisites (GitHub CLI, build tools)
- How to start a contribution
- Tracking contributions (Active tab)
- Session integration
- Creating Symphony-ready issues
- Registering projects

**Start here if you need to**: Learn from user perspective, understand feature capabilities

---

### 6. **SYMPHONY_REGISTRY.md**

**Best for**: Maintainer documentation  
**Contains**:

- Registry schema & format
- How to register a project
- Creating Symphony-ready issues
- Issue blocking/dependencies
- Issue availability rules

**Start here if you need to**: Add projects to Symphony, manage registry

---

### 7. **SYMPHONY_ISSUES.md**

**Best for**: Creating contribution tasks  
**Contains**:

- Issue requirements
- Document path formats
- Example issues
- Auto Run document format
- Best practices
- Blocking dependencies
- Issue availability rules

**Start here if you need to**: Create new Symphony issues for contributors

---

## 🗺️ Navigation Guide by Use Case

### 🔧 I'm a Developer Modifying the Code

1. Start: **SYMPHONY_QUICK_REFERENCE.md** (files & line numbers)
2. Read: **SYMPHONY_CODE_STRUCTURE.md** (architecture)
3. Reference: **SYMPHONY_FLOW_DIAGRAMS.md** (execution flow)
4. Debug: Use grep/search for `[Symphony]` logging

**Key Files to Modify**:

- `src/renderer/components/SymphonyModal.tsx` - UI
- `src/renderer/hooks/symphony/useSymphony.ts` - State
- `src/main/ipc/handlers/symphony.ts` - Business logic
- `src/renderer/App.tsx` - Session integration

---

### 🐛 I Need to Debug an Issue

1. Start: **SYMPHONY_QUICK_REFERENCE.md** (troubleshooting section)
2. Reference: **SYMPHONY_FLOW_DIAGRAMS.md** (where to look)
3. Search: Use debug logging filter for `[Symphony]`
4. Check: State file location: `~/.maestro/symphony/symphony-state.json`

**Quick Debugging Steps**:

```bash
# Watch logs for [Symphony]
npm run dev 2>&1 | grep "\[Symphony\]"

# Check state file
cat ~/.maestro/symphony/symphony-state.json | jq

# Query in DevTools
window.maestro.symphony.getState().then(r => console.log(r));
```

---

### 📚 I'm Learning the Architecture

1. Read: **SYMPHONY_CODE_STRUCTURE.md** (structure section)
2. Study: **SYMPHONY_FLOW_DIAGRAMS.md** (all diagrams)
3. Trace: **SYMPHONY_QUICK_REFERENCE.md** (call chains)
4. Review: Source code with line numbers from Quick Reference

**Learning Path**:

1. Understand types: `src/shared/symphony-types.ts`
2. See UI: `src/renderer/components/SymphonyModal.tsx`
3. Study hooks: `src/renderer/hooks/symphony/useSymphony.ts`
4. Deep dive: `src/main/ipc/handlers/symphony.ts` (2949 lines)
5. Integration: `src/renderer/App.tsx` lines 8820-9015

---

### 🎯 I'm Adding a New Feature

1. Check: **SYMPHONY_QUICK_REFERENCE.md** (developer tips section)
2. Design: **SYMPHONY_CODE_STRUCTURE.md** (integration points)
3. Implement: Following the call chain in **SYMPHONY_FLOW_DIAGRAMS.md**
4. Test: Use testing checklist in Quick Reference

**Steps**:

1. Define new type in `src/shared/symphony-types.ts`
2. Add constant in `src/shared/symphony-constants.ts`
3. Add IPC handler in `src/main/ipc/handlers/symphony.ts`
4. Expose in `src/main/preload/symphony.ts`
5. Use in renderer components
6. Add logging with `logger` or `console.log`
7. Test and document

---

### 👥 I'm a Maintainer or Project Owner

1. Read: **docs/symphony.md** (user perspective)
2. Refer: **SYMPHONY_REGISTRY.md** (registry management)
3. Create: **SYMPHONY_ISSUES.md** (issue creation)

**Key Tasks**:

- Register project in `symphony-registry.json`
- Create Auto Run documents
- Open GitHub issues with `runmaestro.ai` label
- List document paths in issue body

---

### 🧪 I'm Writing Tests

1. Reference: **SYMPHONY_CODE_STRUCTURE.md** (error scenarios)
2. Check: Test files in `src/__tests__/`
3. Learn: Existing tests for patterns

**Test Files**:

- `src/__tests__/main/ipc/handlers/symphony.test.ts`
- `src/__tests__/main/services/symphony-runner.test.ts`
- `src/__tests__/shared/symphony-types.test.ts`
- `src/__tests__/integration/symphony.integration.test.ts`

---

## 🎯 Key Concepts

### The "New Agent" Flow at a Glance

```
User clicks "Start Symphony" button
         ↓
Select repository from Symphony modal
         ↓
Click "Start Symphony" on an issue
         ↓
AgentCreationDialog opens (select AI provider)
         ↓
User confirms with session name & working directory
         ↓
SEQUENCE BEGINS:
  1. Clone repository (git clone --depth=1)
  2. Create branch (git checkout -b symphony/...)
  3. Push empty commit (git push)
  4. Create draft PR (gh pr create --draft)
  5. Register contribution in persistent state
  6. Create Maestro session with symphonyMetadata
  7. Auto-start batch Auto Run with all documents
         ↓
Contribution appears in "Active" tab
         ↓
Batch processes documents sequentially
         ↓
Progress tracked & displayed in real-time
         ↓
On completion: Move to "History" tab
```

---

### Data Layer

**Persistent Storage**: `~/.maestro/symphony/`

```
symphony-state.json     # Active & completed contributions
symphony-cache.json     # Registry & issues cache
symphony-repos/         # Cloned repositories
```

**In-Memory State** (React hooks):

```
useSymphony
├─ registry              # Cached projects
├─ repositories          # Filtered list
├─ selectedRepo          # Currently viewing
├─ repoIssues           # Issues for that repo
├─ symphonyState        # Active & history
└─ activeContributions  # Currently running
```

**Session Metadata** (stored in Session object):

```
symphonyMetadata: {
  isSymphonySession: true,
  contributionId,
  repoSlug, issueNumber, issueTitle,
  documentPaths: [...],
  status: 'running' | 'completed' | ...
}
```

---

### Communication Layers

**Renderer ↔ Main Process**:

```
IPC Handlers via ipcRenderer.invoke()
├─ symphony:getRegistry
├─ symphony:getIssues
├─ symphony:cloneRepo
├─ symphony:startContribution
├─ symphony:registerActive
├─ symphony:updateStatus
├─ symphony:complete
└─ ... (20+ handlers)

Real-time Events via ipcRenderer.on()
├─ symphony:updated          (broadcast on state change)
├─ symphony:contributionStarted
├─ symphony:prCreated
├─ symphony:prMerged
└─ symphony:prClosed
```

---

## 📋 Common Reference

### File Locations

| What         | Where                                             |
| ------------ | ------------------------------------------------- |
| Types        | `src/shared/symphony-types.ts`                    |
| Constants    | `src/shared/symphony-constants.ts`                |
| UI Modal     | `src/renderer/components/SymphonyModal.tsx`       |
| Agent Dialog | `src/renderer/components/AgentCreationDialog.tsx` |
| Hooks        | `src/renderer/hooks/symphony/`                    |
| Main Handler | `src/main/ipc/handlers/symphony.ts` (2949 lines)  |
| Preload API  | `src/main/preload/symphony.ts`                    |
| Runner       | `src/main/services/symphony-runner.ts`            |
| Integration  | `src/renderer/App.tsx:8820`                       |
| Tests        | `src/__tests__/**/*symphony*`                     |

### Key Line Numbers

| What                          | File              | Line |
| ----------------------------- | ----------------- | ---- |
| "Start Symphony" button       | SymphonyModal.tsx | 951  |
| handleStartContribution       | SymphonyModal.tsx | 1490 |
| handleCreateAgent             | SymphonyModal.tsx | 1494 |
| startContribution hook        | useSymphony.ts    | 275  |
| cloneRepo handler             | symphony.ts       | 2262 |
| startContribution handler     | symphony.ts       | 2299 |
| registerActive handler        | symphony.ts       | 1402 |
| onStartContribution (App.tsx) | App.tsx           | 8820 |
| Session creation              | App.tsx           | 8884 |
| Auto Run batch start          | App.tsx           | 8990 |

---

## 🔗 Cross-References

### Related Features

- **Auto Run**: Batch document processing with checkboxes
- **Sessions**: Maestro workspaces with agent + terminal
- **Git Integration**: Branch/commit tracking in left bar
- **Stats Dashboard**: Usage analytics and metrics
- **Achievements**: Milestone rewards for contributions

### External Resources

- [GitHub CLI](https://cli.github.com/)
- [Maestro Docs](https://docs.runmaestro.ai/)
- [Symphony Registry](https://github.com/RunMaestro/Maestro/blob/main/symphony-registry.json)
- [Maestro Repository](https://github.com/RunMaestro/Maestro)

---

## 🚀 Getting Started

### For Code Reviewers

1. Read **SYMPHONY_QUICK_REFERENCE.md** (5 min)
2. Skim **SYMPHONY_CODE_STRUCTURE.md** (10 min)
3. Review code with line numbers from Quick Reference
4. Check **SYMPHONY_FLOW_DIAGRAMS.md** for execution path

### For New Developers

1. Complete **SYMPHONY_CODE_STRUCTURE.md** (20 min)
2. Study **SYMPHONY_FLOW_DIAGRAMS.md** (15 min)
3. Read **SYMPHONY_QUICK_REFERENCE.md** (10 min)
4. Follow call chain while reading source code
5. Run tests: `npm run test -- symphony`

### For Maintainers

1. Read **SYMPHONY_REGISTRY.md** (10 min)
2. Read **SYMPHONY_ISSUES.md** (10 min)
3. Review **docs/symphony.md** (15 min)
4. Register project in `symphony-registry.json`

---

## 💡 Pro Tips

### Debugging

- Search logs for `[Symphony]` to filter Symphony logs
- Check `~/.maestro/symphony/symphony-state.json` for state
- Use DevTools: `window.maestro.symphony.getState()`
- Set breakpoints in symphony.ts IPC handler for step-through

### Development

- Keep types in `symphony-types.ts` and constants in `symphony-constants.ts`
- Always validate inputs in IPC handlers
- Broadcast `symphony:updated` after state changes
- Use logger for consistent formatting
- Add integration tests for new handlers

### Performance

- Use shallow git clone (`--depth=1`)
- Cache registry (2h) and issues (5m)
- Debounce state updates (500ms)
- Lazy load components in modal

---

## 📞 Support

For issues or questions:

1. Check **SYMPHONY_QUICK_REFERENCE.md** troubleshooting section
2. Search code for logging patterns
3. Review **SYMPHONY_FLOW_DIAGRAMS.md** for execution flow
4. Open issue in Maestro repository with `[Symphony]` tag

---

## 📝 Document Versions

| Document        | Version | Updated                    | Key Sections |
| --------------- | ------- | -------------------------- | ------------ |
| Quick Reference | 1.0     | 2024-02-18                 | All topics   |
| Code Structure  | 1.0     | 2024-02-18                 | 10 sections  |
| Flow Diagrams   | 1.0     | 2024-02-18                 | 10 diagrams  |
| User Docs       | current | (via docs/symphony.md)     | —            |
| Registry Guide  | current | (via SYMPHONY_REGISTRY.md) | —            |

---

## 🎓 Learning Objectives

After reading this documentation, you should understand:

✅ The complete "Start Symphony" → "New Agent" workflow  
✅ How renderer, IPC, and main process communicate  
✅ Where to find key code sections  
✅ How to debug issues with logging  
✅ The state persistence and data flow  
✅ Real-time event system  
✅ Error handling and recovery  
✅ Testing approach  
✅ Performance optimizations  
✅ Security considerations

---

**Happy coding! 🎵**

For the latest updates, check the repository: https://github.com/RunMaestro/Maestro
