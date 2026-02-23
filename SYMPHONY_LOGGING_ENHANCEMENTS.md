# Symphony Feature - Enhanced Logging Summary

## Overview

Enhanced logging has been added throughout the Maestro Symphony feature to help diagnose failures and track execution flow. This document describes all the logging enhancements made to help identify where the feature breaks.

## File Modified

**Primary File:** `src/main/ipc/handlers/symphony.ts` (2949 lines)

## Logging Enhancements by Flow Section

### 1. Registry Fetching and Caching (`symphony:getRegistry`)

**Location:** Lines 1028-1090  
**What gets logged:**

- **Entry:** `symphony:getRegistry called` with `forceRefresh` parameter
- **Cache Hit:** Detailed cache info (age in seconds, repo count)
- **Cache Miss:** Flag indicating cache is expired or missing
- **Fetch Start:** About to fetch fresh registry from GitHub
- **Success:** Repository count, enrichment completion
- **Cache Update:** Confirmation that cache was persisted
- **Fallback:** If fetch fails, logs cache age and repo count when falling back to stale data
- **Error:** Full error message and context

**Log Levels Used:**

- `debug` - for granular tracking (cache hits/misses, enrichment)
- `info` - for main operations (fetch start, success)
- `warn` - for fallback scenarios
- `error` - for missing cache fallback situations

---

### 2. Issue Fetching and Document Parsing (`symphony:getIssues`)

**Location:** Lines 1098-1164  
**What gets logged:**

- **Entry:** `symphony:getIssues called` with repo slug and force refresh flag
- **Cache Hit:** Issue count, cache age
- **Cache Miss:** Log that cache is expired/missing
- **Fetch Start:** Repository slug and label being queried
- **Raw Issues:** Number of issues received from GitHub API
- **Document Parsing:** Per-issue document count as they're being parsed
- **PR Enrichment:** Start of PR status enrichment process with issue count
- **Summary:** Available vs in-progress issue counts
- **Fallback:** Cache age and issue count when falling back
- **Error:** Full error message with repository slug context

**Document Parsing Details (`parseDocumentPaths`)**

- **Entry:** Body length
- **External Docs Found:** Filename and GitHub host validation
- **Repo Docs Found:** Filename and relative path
- **Summary:** Total, external, and repo document counts

**Log Levels Used:**

- `debug` - for detailed parsing steps
- `info` - for main fetch operations and summaries
- `warn` - for fallback scenarios and API errors
- `error` - for fetch failures

---

### 3. Contribution Startup (`symphony:startContribution`)

**Location:** Lines 2406-2828  
**What gets logged:**

#### Entry & Validation

- **Entry:** Full parameters (contribution ID, session ID, repo slug, issue number, document count)
- **Repo Slug Validation:** Validation result, error if invalid
- **Issue Number Validation:** Validation result, error if invalid
- **Document Path Validation:** Per-document validation (external vs repo-relative)
  - External: Protocol check, hostname validation
  - Repo-relative: Path traversal checks
- **GitHub CLI Auth Check:** Authentication status and any errors

#### Branch Creation

- **Start:** Branch creation begins
- **Branch Name:** Generated branch name
- **Success:** Confirmation of branch creation
- **Failure:** Error details if branch creation fails

#### AutoRun Documents Setup

- **Start:** Number of documents to process
- **Per External Document:**
  - Fetch start with URL
  - HTTP status if download fails
  - Success with file size in bytes
  - Download errors with details
- **Per Repo Document:**
  - Path resolution and traversal check
  - File existence verification
  - Success with resolved path
  - Not found errors
- **Summary:** Total resolved documents broken down by type (external vs repo)

#### Metadata & AutoRun Path

- **Metadata Writing:** Confirmation of metadata file creation
- **Path Determination:** Whether external docs are present, autorun path selection

#### PR Creation Workflow

- **Start:** PR creation workflow begins
- **Default Branch:** What branch was identified as default
- **Empty Commit:** Commit message, creation attempt
- **Draft PR Attempt:** Issue number and repo slug
- **Success:** Draft PR number and URL
- **Metadata Update:** PR info persisted
- **Failure:** Error details if PR creation fails
- **Fallback:** If empty commit fails, logs that continuing without PR

#### Broadcast & Return

- **Broadcast Event:** Confirmation that event was sent to main window
- **Window Status:** If main window is available
- **Summary:** Final success log with all key details
- **Error:** Stack trace and full error message on failure

**Log Levels Used:**

- `debug` - for detailed validation and path resolution steps
- `info` - for major operation starts and completions
- `warn` - for validation failures, missing docs, PR failures
- `error` - for critical failures (branch creation, metadata errors)

---

### 4. Draft PR Creation (`symphony:createDraftPR`)

**Location:** Lines 2835-3040  
**What gets logged:**

- **Entry:** `symphony:createDraftPR called` with contribution ID
- **Metadata Read:** Confirmation of metadata load with repo slug and path info
- **PR Already Exists:** If PR was already created (returns cached info)
- **GitHub CLI Auth:** Authentication check during PR creation
- **Commit Count Check:**
  - Git command execution result
  - Commit count found on branch
  - If zero commits, early exit
- **PR Creation:**
  - Commits found, ready to create PR
  - PR title and body prepared
  - Calling createDraftPR helper
- **PR Success:**
  - PR number and URL
  - Metadata file updated
  - State file updated with PR info
  - Event broadcast confirmation
- **Errors:**
  - Failed to read metadata (path included)
  - GitHub CLI authentication failures
  - Commit count check failures
  - PR creation failures with exit code
  - State update failures

**Log Levels Used:**

- `debug` - for detailed steps (metadata load, PR preparation)
- `info` - for main operations (commits found, PR created, workflow complete)
- `warn` - for missing active contributions in state
- `error` - for critical failures (metadata read, PR creation)

---

### 5. Repository Cloning (`symphony:cloneRepo`)

**Location:** Lines 2369-2420  
**What gets logged:**

- **Entry:** `symphony:cloneRepo called`
- **URL Validation:** GitHub URL format validation
- **Parent Directory:** Creation of parent directories for clone
- **Clone Start:** Shallow clone begins
- **Clone Success:** Repository cloned successfully
- **Errors:**
  - URL validation failures
  - Directory creation failures
  - Clone failures with git error messages

**Log Levels Used:**

- `debug` - for validation and directory steps
- `info` - for main operations
- `warn` - for validation failures
- `error` - for critical failures

---

### 6. Git Helper Functions

#### `cloneRepository()`

- Logs repository URL and target path
- Logs success with target path
- Logs failures with exit code and stderr

#### `createBranch()`

- Logs branch name
- Logs success when branch created and checked out
- Logs failures with branch name and git error

#### `checkGhAuthentication()`

- Entry log for authentication check
- Detailed logs for auth status checks
- Specific error logs for:
  - Not authenticated
  - gh CLI not installed
  - Other gh CLI errors

#### `getDefaultBranch()`

- Logs branch determination process
- Logs result from symbolic-ref check
- Logs fallback to common branch names (main/master)
- Logs final default choice

#### `createDraftPR()`

- **Entry:** Workflow start with base branch
- **Auth Check:** Verification of GitHub CLI authentication
- **Branch Name:** Current branch determination
- **Push:** Branch push to origin with name
- **Push Success:** Confirmation of remote push
- **PR Creation:** Start of PR creation via gh CLI
- **PR Parse:** Parsing of PR URL and number
- **Success:** Final PR number and URL with branch name
- **Errors:**
  - Failed to determine branch
  - Failed to push with stderr
  - Failed to create PR with exit code and stderr
  - Cleanup attempt after PR failure

#### `markPRReady()`

- Logs PR number being marked as ready
- Logs success after marking
- Logs failures with exit code and stderr

---

## Critical Failure Points to Watch For

Based on the logging enhancements, here are the key failure points you should watch for in the logs:

### 1. **GitHub API Issues**

- Look for: `Failed to fetch Symphony registry from GitHub`
- Look for: `Failed to fetch Symphony issues from GitHub`
- These indicate network/auth issues with GitHub API

### 2. **Authentication Failures**

- Look for: `GitHub CLI authentication check failed`
- Look for: `GitHub CLI not authenticated`
- Look for: `GitHub CLI not found`
- These indicate user isn't authenticated with `gh` CLI

### 3. **Repository Clone Failures**

- Look for: `Repository clone failed`
- Check the stderr for the actual git error

### 4. **Branch Creation Issues**

- Look for: `Failed to create branch`
- This could be permissions or git configuration issues

### 5. **Document Download Issues**

- Look for: `Failed to download document - HTTP error`
- Look for: `Failed to download document - error` (non-HTTP errors)
- These indicate external document links in the issue might be broken or inaccessible

### 6. **AutoRun Path Issues**

- Look for: `Document not found in repo`
- This means the issue references a document that doesn't exist in the repo

### 7. **PR Creation Failures**

- Look for: `Failed to create draft PR`
- Look for: `Empty commit failed`
- These are critical - check the GitHub CLI is properly authenticated
- Could also be permissions issues on the repository

### 8. **Draft PR Already Exists**

- Look for: `Draft PR already exists`
- This is informational - the contribution is resuming an existing PR

### 9. **State/Metadata Issues**

- Look for: `Failed to read contribution metadata`
- Look for: `Active contribution not found in state`
- These indicate persistence issues

---

## How to Use These Logs for Debugging

### Step 1: Start a Symphony contribution and check the logs

1. Look at the initial logs to see if the feature is entering the handlers
2. Check if caching is working (`Cache hit` vs `Cache miss`)
3. Verify GitHub API calls are succeeding

### Step 2: Monitor contribution startup

1. Check if parameters are validated successfully
2. Monitor GitHub CLI authentication check
3. Watch for any document parsing issues
4. Track branch creation and commit

### Step 3: Monitor PR creation

1. Check if the initial empty commit was created
2. Verify the branch was pushed to remote
3. Monitor the draft PR creation via `gh` CLI
4. Check if metadata and state were updated

### Step 4: Check for specific failure points

Use the critical failure points list above to search the logs for specific error messages if something fails.

---

## Log Output Example Structure

A successful Symphony workflow will show logs like:

```
[Symphony] symphony:getRegistry called
[Symphony] Registry cache miss or expired, fetching fresh data
[Symphony] Fetching registry from GitHub
[Symphony] Registry fetched successfully
[Symphony] Registry cache updated

[Symphony] symphony:getIssues called
[Symphony] Issues cache miss or expired, fetching fresh data
[Symphony] Fetching issues for owner/repo with label runmaestro.ai
[Symphony] Issues fetched successfully
[Symphony] Document path parsing complete (found X documents)

[Symphony] symphony:startContribution called
[Symphony] Validating contribution parameters
[Symphony] GitHub CLI authentication verified
[Symphony] Creating branch for contribution
[Symphony] Branch created successfully
[Symphony] Starting document resolution (X total documents)
[Symphony] Document resolution complete (X resolved)
[Symphony] Starting PR creation workflow
[Symphony] Empty commit created successfully
[Symphony] Attempting to create draft PR
[Symphony] Draft PR created successfully
[Symphony] Symphony contribution started successfully
```

---

## Summary

Over **100+ new log statements** have been added across the Symphony IPC handlers and helper functions, providing detailed visibility into:

- ✅ Registry fetching and caching
- ✅ Issue fetching and filtering
- ✅ Document parsing and validation
- ✅ Contribution parameter validation
- ✅ Git operations (clone, branch, push)
- ✅ Document download and handling
- ✅ AutoRun document setup
- ✅ PR creation and state management
- ✅ GitHub CLI authentication
- ✅ Error handling and fallbacks

This should enable you to pinpoint exactly where the Symphony workflow breaks when issues occur.
