# Phase 6: UI Integration

Integrate GitHub Copilot CLI into the user interface.

## Prerequisites

- [ ] Phase 1: Research & Setup completed
- [ ] Phase 2: Core Agent Definition completed
- [ ] Phase 3: Output Parser completed
- [ ] Phase 4: CLI Spawner Integration completed
- [ ] Phase 5: Session Storage completed (or skipped)

## Implementation Tasks

### 6.1 Agent Availability Display

**File:** `src/renderer/hooks/agent/useAvailableAgents.ts` or similar

The UI already has logic to detect and display available agents. Copilot should appear automatically if installed.

**Task:** Verify Copilot appears in agent list
```bash
npm run dev
# Open app and check Settings > Agents
# GitHub Copilot CLI should be listed
```

- [ ] Copilot CLI appears in agents list
- [ ] Shows as "available" if binary is installed
- [ ] Shows as "unavailable" if binary is missing
- [ ] Help text suggests installation if unavailable

### 6.2 Agent Selection in Sessions

**File:** `src/renderer/components/SessionForm.tsx` or similar

The session creation form should allow selecting Copilot CLI as the agent.

**Task:** Test agent selection
```bash
npm run dev
# Create new session
# Open agent dropdown
# GitHub Copilot CLI should be selectable
```

- [ ] Copilot CLI appears in agent dropdown
- [ ] Can be selected for new sessions
- [ ] Selected agent is saved correctly
- [ ] Icon/badge displays correctly

### 6.3 Configuration UI

**File:** `src/renderer/components/AgentSettings.tsx` or similar

Users should be able to configure Copilot's options (e.g., model selection).

**Task:** Check configuration options appear
```bash
npm run dev
# Go to Settings > Agents > GitHub Copilot CLI
# Should show available configuration options
```

- [ ] Model selection option appears
- [ ] Current value is displayed
- [ ] Changes are saved to settings
- [ ] Values are applied when spawning agent

### 6.4 Session Display & Management

**File:** `src/renderer/components/SessionView.tsx` or similar

Sessions running Copilot should display output correctly.

- [ ] Copilot responses display in chat area
- [ ] Streaming output shows in real-time
- [ ] Errors are displayed appropriately
- [ ] Session metadata shows agent as "Copilot"

**Task:** Test session display
```bash
npm run dev
# Create session with Copilot CLI
# Send a message and wait for response
# Verify output displays correctly
```

- [ ] Output appears in UI
- [ ] Formatting is correct
- [ ] No parsing errors in console
- [ ] Loading state works
- [ ] Completion state detected

### 6.5 Agent Icon/Badge

**File:** `src/renderer/components/AgentBadge.tsx` or similar

Copilot should have a distinctive icon/badge in the UI.

**Task:** Add Copilot icon
```typescript
// In agent icon mapping, add:
'copilot-cli': '🤖', // or GitHub Copilot branded emoji
```

- [ ] Copilot has distinctive icon
- [ ] Icon is visible in session list
- [ ] Icon is visible in agent dropdown
- [ ] Icon is visible in session header

### 6.6 Settings Panel

**File:** `src/renderer/pages/SettingsPage.tsx` or similar

Add Copilot-specific settings to the settings panel.

**Task:** Check Copilot settings
```bash
npm run dev
# Go to Settings
# Look for Copilot CLI section
```

- [ ] Copilot section appears in settings
- [ ] Installation status is shown
- [ ] Configuration options are visible
- [ ] Help text is clear

### 6.7 Dashboard/Statistics (if applicable)

**File:** `src/renderer/components/Dashboard.tsx` or similar

If dashboard shows agent usage statistics:

- [ ] Copilot sessions count displayed
- [ ] Copilot usage metrics shown
- [ ] Copilot in agent breakdown chart

**Task:** Verify dashboard shows Copilot
```bash
npm run dev
# Go to Dashboard (if exists)
# Check that Copilot stats appear if it's been used
```

- [ ] Copilot appears in usage charts
- [ ] Session count is accurate
- [ ] Duration tracking works

## Testing Tasks

### 6.1 Component Tests

**File:** `src/__tests__/renderer/components/SessionForm.test.tsx` or similar

- [ ] Copilot CLI can be selected in form
- [ ] Configuration is saved
- [ ] Icon displays correctly

**Task:** Create component test
```typescript
// Add to existing component tests:

describe('SessionForm with Copilot', () => {
  it('should display Copilot CLI in agent list', () => {
    const { getByText } = render(<SessionForm />);
    const agentDropdown = getByText('Select Agent');
    fireEvent.click(agentDropdown);
    
    expect(getByText('GitHub Copilot CLI')).toBeInTheDocument();
  });

  it('should allow selecting Copilot', () => {
    const { getByText, getByDisplayValue } = render(<SessionForm />);
    const agentDropdown = getByText('Select Agent');
    fireEvent.click(agentDropdown);
    fireEvent.click(getByText('GitHub Copilot CLI'));
    
    expect(getByDisplayValue('copilot-cli')).toBeInTheDocument();
  });
});
```

### 6.2 E2E Tests

**File:** `e2e/copilot-ui.spec.ts`

- [ ] Can create session with Copilot
- [ ] Can send message to Copilot
- [ ] Response is displayed
- [ ] Configuration changes work
- [ ] Sessions are saved

**Task:** Create E2E test
```typescript
// Create: e2e/copilot-ui.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Copilot CLI UI Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should create and use Copilot session', async ({ page }) => {
    // 1. Click "New Session"
    await page.click('button:has-text("New Session")');

    // 2. Select Copilot from dropdown
    await page.selectOption('select[name="agent"]', 'copilot-cli');

    // 3. Enter prompt
    await page.fill('textarea[name="prompt"]', 'What is JavaScript?');

    // 4. Submit
    await page.click('button:has-text("Send")');

    // 5. Wait for response
    const response = page.locator('[data-test="agent-response"]');
    await expect(response).toBeVisible({ timeout: 30000 });

    // 6. Verify response contains text
    const text = await response.textContent();
    expect(text).toBeTruthy();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('should display Copilot icon in session list', async ({ page }) => {
    // Create session with Copilot
    // Icon should show next to session name
    const icon = page.locator('[data-test="agent-icon"]:has-text("🤖")');
    await expect(icon).toBeVisible();
  });
});
```

### 6.3 Manual Testing Checklist

#### Session Creation
- [ ] Open Maestro app
- [ ] Click "New Session"
- [ ] Open agent dropdown
- [ ] GitHub Copilot CLI visible
- [ ] Select Copilot CLI
- [ ] Form submits successfully
- [ ] Session appears in session list
- [ ] Copilot icon is visible

#### Sending Messages
- [ ] Session is active
- [ ] Enter prompt: "Explain recursion"
- [ ] Click Send
- [ ] Loading indicator appears
- [ ] Response appears after ~5-10 seconds
- [ ] Response is readable and formatted correctly
- [ ] No errors in browser console
- [ ] No errors in main process logs

#### Configuration
- [ ] Go to Settings > Agents
- [ ] Find GitHub Copilot CLI
- [ ] Check "Available" status
- [ ] Click on Copilot CLI section
- [ ] Model selection option visible
- [ ] Change model selection
- [ ] Create new session with different model
- [ ] Verify model change was applied (check logs)

#### Multiple Sessions
- [ ] Create 2 sessions with Copilot
- [ ] Send messages to both
- [ ] Both should work independently
- [ ] Session list shows both
- [ ] Can switch between them
- [ ] Previous responses are preserved

#### Error Handling
- [ ] Test with invalid configuration
- [ ] Test with network unavailable (if applicable)
- [ ] Test with invalid auth (if applicable)
- [ ] Verify error messages are clear
- [ ] Check error is recoverable or suggests fix

## UI Verification Checklist

### Visibility
- [ ] Agent appears in agent dropdown
- [ ] Agent appears in settings panel
- [ ] Agent icon is visible
- [ ] Configuration options are visible
- [ ] Help text is clear and helpful

### Functionality
- [ ] Can select agent for new session
- [ ] Can configure agent settings
- [ ] Can send messages to Copilot
- [ ] Responses display correctly
- [ ] Multiple sessions work independently
- [ ] Session data is preserved
- [ ] Settings changes apply correctly

### Display Quality
- [ ] No layout shifts when selecting Copilot
- [ ] Icon is appropriate and clear
- [ ] Text is readable
- [ ] Styling matches existing agents
- [ ] Responsive on different screen sizes

### User Experience
- [ ] Clear instructions for setup/installation
- [ ] Helpful error messages if not available
- [ ] Smooth transitions between states
- [ ] No console errors or warnings
- [ ] Loading states are clear

## Styling & Theming

### 6.8 Ensure Theme Compatibility

**File:** `src/renderer/stores/theme.ts` or similar

- [ ] Verify Copilot UI works in light theme
- [ ] Verify Copilot UI works in dark theme
- [ ] Icon is visible in both themes
- [ ] Text is readable in both themes

**Task:** Test both themes
```bash
npm run dev
# Switch between light and dark themes
# Verify Copilot UI is visible and usable in both
```

## Documentation Updates

### 6.9 Update In-App Help

**File:** `src/renderer/components/HelpPanel.tsx` or similar

- [ ] Add Copilot CLI to list of supported agents
- [ ] Include setup instructions
- [ ] Include configuration guide
- [ ] Link to Copilot CLI documentation

### 6.10 Update User Documentation

**File:** `docs/getting-started.md` or similar

- [ ] Add Copilot CLI to agent list
- [ ] Include installation instructions
- [ ] Include setup/authentication steps
- [ ] Include example usage

**Task:** Update documentation
- [ ] Installation: `gh extension install github/gh-copilot`
- [ ] Authentication: `gh auth login`
- [ ] First use: Create session and send message
- [ ] Troubleshooting: What to do if not found

## Verification Checklist

### UI Integration
- [ ] Copilot appears in agent list
- [ ] Can select Copilot for new session
- [ ] Configuration options are visible
- [ ] Sessions display correctly
- [ ] Icon/badge displays correctly

### Styling
- [ ] Works in light theme
- [ ] Works in dark theme
- [ ] Responsive design maintained
- [ ] Consistent with other agents

### Documentation
- [ ] User guide updated
- [ ] In-app help updated
- [ ] Installation instructions clear
- [ ] Setup instructions clear

### Testing
- [ ] Manual testing successful
- [ ] E2E tests pass
- [ ] Component tests pass
- [ ] No console errors

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Copilot doesn't appear in agent list" | Check if binary is in PATH, restart app |
| "Icon doesn't display" | Verify emoji support in terminal/UI |
| "Configuration not saving" | Check localStorage permissions |
| "Response not displaying" | Check output parser is working |
| "Layout shifts when selecting Copilot" | Verify icon width is consistent |

## Notes

**UI Framework:**
- Component framework: React/Vue/Svelte (check existing codebase)
- State management: Check existing pattern
- Styling: Tailwind CSS or other (check existing)

**Design Consistency:**
- Follow existing UI patterns for agents
- Match icon style and size
- Use consistent naming conventions
- Maintain established color schemes

## Next Steps

Once Phase 6 is complete and all UI elements are verified:
1. Proceed to Phase 7: Testing & Documentation
2. Create comprehensive test suite
3. Document for release
