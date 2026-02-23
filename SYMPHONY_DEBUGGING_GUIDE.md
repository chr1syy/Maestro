# Symphony Feature - Quick Debugging Reference

## What Was Done

Enhanced logging has been added to the Maestro Symphony feature in `src/main/ipc/handlers/symphony.ts` to help diagnose where the feature breaks. **127 total log statements** were added/updated across the codebase.

## Key Files Modified

- **Main File:** `src/main/ipc/handlers/symphony.ts`
- **Documentation:** `SYMPHONY_LOGGING_ENHANCEMENTS.md` (in project root)

## The Symphony Feature Flow

```
User Selects Project in Symphony UI
         ↓
symphony:getRegistry (fetch available projects)
         ↓
User Selects Issue
         ↓
symphony:getIssues (fetch issues with runmaestro.ai label)
         ↓
User Clicks "Start Symphony"
         ↓
symphony:cloneRepo (clone repository locally)
         ↓
symphony:startContribution:
  - Validate parameters
  - Check GitHub CLI auth
  - Create branch
  - Download/resolve documents
  - Create empty commit
  - Create draft PR
         ↓
User Starts AutoRun in Agent
         ↓
Agent Executes AutoRun Documents
         ↓
On First Commit:
symphony:createDraftPR (create draft PR to claim issue)
         ↓
Agent Completes Work
         ↓
User Clicks "Complete"
         ↓
symphony:complete (mark PR as ready, post stats)
```

## Most Likely Failure Points (In Order)

### 1. **GitHub CLI Authentication** ❌

**Look for:** `GitHub CLI authentication check failed` or `GitHub CLI not authenticated`
**Fix:** Run `gh auth login` to authenticate

### 2. **Repository Clone Issues** ❌

**Look for:** `Repository clone failed`
**Reason:** Could be network issues, invalid URL, or git configuration
**Fix:** Check internet connection, verify repo URL

### 3. **Document Resolution** ❌

**Look for:** `Document not found in repo` or `Failed to download document`
**Reason:** External document URLs broken or repo-relative paths don't exist
**Fix:** Check issue has correct document references

### 4. **Draft PR Creation** ❌

**Look for:** `Failed to create draft PR` or `Empty commit failed`
**Reason:** GitHub CLI permissions, authentication, or network issues
**Fix:** Ensure `gh` CLI has repo access, check GitHub permissions

### 5. **GitHub API Rate Limiting** ⚠️

**Look for:** GitHub API responses with 403 or 429 status codes
**Reason:** Too many requests to GitHub API
**Fix:** Wait before retrying, check API limits

## Quick Log Search Commands

```bash
# View all Symphony logs
grep "\[Symphony\]" ~/.maestro/logs/main.log | tail -100

# Find errors
grep "\[Symphony\].*error" ~/.maestro/logs/main.log

# Find authentication issues
grep "authentication\|auth status" ~/.maestro/logs/main.log

# Find PR creation issues
grep "draft PR\|PR creation" ~/.maestro/logs/main.log

# Find document issues
grep "document\|download" ~/.maestro/logs/main.log

# Follow logs in real-time (if available)
tail -f ~/.maestro/logs/main.log | grep "\[Symphony\]"
```

## New Log Levels

The enhanced logging uses:

- **debug** - Granular flow tracking (cache details, validations, path resolution)
- **info** - Main operation milestones (fetch starts, success points)
- **warn** - Non-critical issues that are handled (fallbacks, missing docs)
- **error** - Critical failures that need attention (auth failures, API errors)

## Testing Your Logs

1. **Start a Symphony contribution** from the Maestro UI
2. **Select a project** with `runmaestro.ai` labeled issues
3. **Watch the logs** for:
   - Registry fetch success/failure
   - Issues list retrieval
   - Document parsing
4. **Click "Start Symphony"** and monitor:
   - Clone progress
   - Parameter validation
   - Document downloads
   - PR creation
5. **Look for any ERROR or WARN** messages to pinpoint failure

## Common Issues & Solutions

| Issue             | Look For                          | Solution                               |
| ----------------- | --------------------------------- | -------------------------------------- |
| No issues showing | `Failed to fetch Symphony issues` | Check GitHub API auth, rate limits     |
| Clone fails       | `Repository clone failed`         | Check repo URL, internet connection    |
| Documents missing | `Document not found in repo`      | Verify issue has correct doc paths     |
| PR not created    | `Failed to create draft PR`       | Run `gh auth login`, check permissions |
| Cache issues      | `Cache miss` repeatedly           | Try force refresh in UI                |
| Slow performance  | `Cache hit` not appearing         | May indicate large repos               |

## For Development/Debugging

To get more detailed logs during development:

```typescript
// In symphony.ts, you can add temporary high-verbosity logging:
logger.debug('Current state at this point', LOG_CONTEXT, {
	variable1: value1,
	variable2: value2,
	// ... whatever context you need
});
```

The logs should now give you complete visibility into:
✅ What data is being fetched  
✅ What validation is happening  
✅ Where failures occur  
✅ What state is being persisted  
✅ How events are being broadcast

This should help you identify exactly where the Symphony feature breaks!
