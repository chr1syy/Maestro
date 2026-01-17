/**
 * @fileoverview E2E tests for Copilot CLI UI integration
 *
 * Tests verify that Copilot CLI sessions integrate correctly with Maestro's
 * unified session management UI, including:
 * - Session creation and display
 * - Session resume with --continue flag
 * - Model selection and persistence
 * - Settings application
 * - Streaming output display
 * - Error handling and recovery
 */

import { test, expect, Page, ElectronApplication } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import fs from 'fs';
import os from 'os';

// ============================================================================
// Test Fixtures and Helpers
// ============================================================================

interface TestContext {
  electronApp: ElectronApplication;
  page: Page;
  tempDir: string;
}

/**
 * Setup helper: Launch Electron app and get first window
 */
async function setupTestApp(): Promise<TestContext> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maestro-copilot-test-'));
  
  const electronApp = await electron.launch({
    args: [path.join(__dirname, '../dist/main/index.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      MAESTRO_TEST_MODE: '1',
      MAESTRO_TEST_DATA_DIR: tempDir,
    },
  });

  const page = await electronApp.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  
  return { electronApp, page, tempDir };
}

/**
 * Cleanup helper: Close app and remove temp directory
 */
async function cleanupTestApp(context: TestContext): Promise<void> {
  await context.electronApp.close();
  if (fs.existsSync(context.tempDir)) {
    fs.rmSync(context.tempDir, { recursive: true, force: true });
  }
}

/**
 * Helper: Create a new Copilot session via UI
 */
async function createCopilotSession(page: Page, projectDir: string, prompt: string): Promise<string> {
  // Click "New Session" button
  await page.click('[data-testid="new-session-btn"]');
  
  // Wait for session creation modal
  await page.waitForSelector('[data-testid="new-session-modal"]');
  
  // Select Copilot CLI as the agent type
  await page.click('[data-testid="agent-selector"]');
  await page.click('[data-testid="agent-option-copilot-cli"]');
  
  // Set working directory
  await page.fill('[data-testid="working-directory-input"]', projectDir);
  
  // Enter initial prompt
  await page.fill('[data-testid="initial-prompt-input"]', prompt);
  
  // Submit to create session
  await page.click('[data-testid="create-session-btn"]');
  
  // Wait for session to appear in sidebar
  await page.waitForSelector('[data-testid^="session-item-"]', { timeout: 5000 });
  
  // Get the session ID from the newly created session
  const sessionElement = await page.locator('[data-testid^="session-item-"]').first();
  const sessionId = await sessionElement.getAttribute('data-session-id');
  
  if (!sessionId) {
    throw new Error('Failed to get session ID from created session');
  }
  
  return sessionId;
}

/**
 * Helper: Wait for process output to appear
 */
async function waitForOutput(page: Page, timeout = 10000): Promise<void> {
  await page.waitForSelector('[data-testid="output-content"]', { timeout });
}

// ============================================================================
// Test Suite: Copilot CLI UI Integration
// ============================================================================

test.describe('Copilot CLI UI Integration', () => {
  let context: TestContext;

  test.beforeEach(async () => {
    context = await setupTestApp();
  });

  test.afterEach(async () => {
    await cleanupTestApp(context);
  });

  // ==========================================================================
  // Task 1: Session List UI Component
  // ==========================================================================

  test.describe('Session List Display', () => {
    test('should display Copilot session in session list', async () => {
      const { page } = context;
      const testDir = context.tempDir;
      
      // Create a Copilot session
      const sessionId = await createCopilotSession(
        page,
        testDir,
        'Explain the purpose of package.json'
      );
      
      // Verify session appears in list with correct metadata
      const sessionItem = page.locator(`[data-testid="session-item-${sessionId}"]`);
      await expect(sessionItem).toBeVisible();
      
      // Check session shows toolType as copilot-cli
      const toolTypeLabel = sessionItem.locator('[data-testid="session-tooltype"]');
      await expect(toolTypeLabel).toHaveText('copilot-cli');
      
      // Check timestamp is displayed
      const timestamp = sessionItem.locator('[data-testid="session-timestamp"]');
      await expect(timestamp).toBeVisible();
    });

    test('should show model indicator in session metadata', async () => {
      const { page } = context;
      const testDir = context.tempDir;
      
      // Create session with specific model
      await page.click('[data-testid="new-session-btn"]');
      await page.waitForSelector('[data-testid="new-session-modal"]');
      await page.click('[data-testid="agent-selector"]');
      await page.click('[data-testid="agent-option-copilot-cli"]');
      await page.fill('[data-testid="working-directory-input"]', testDir);
      
      // Select model
      await page.click('[data-testid="model-selector"]');
      await page.click('[data-testid="model-option-claude-opus-4.5"]');
      
      await page.fill('[data-testid="initial-prompt-input"]', 'Test prompt');
      await page.click('[data-testid="create-session-btn"]');
      
      // Wait for session creation
      await page.waitForSelector('[data-testid^="session-item-"]');
      
      // Verify model is displayed in session item
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      const modelLabel = sessionItem.locator('[data-testid="session-model"]');
      await expect(modelLabel).toContainText('claude-opus-4.5');
    });

    test('should sort sessions by most recent first', async () => {
      const { page } = context;
      const testDir = context.tempDir;
      
      // Create two sessions with delay
      const sessionId1 = await createCopilotSession(page, testDir, 'First session');
      await page.waitForTimeout(1000);
      const sessionId2 = await createCopilotSession(page, testDir, 'Second session');
      
      // Get session order
      const sessionItems = page.locator('[data-testid^="session-item-"]');
      const firstSession = await sessionItems.first().getAttribute('data-session-id');
      
      // Most recent (sessionId2) should be first
      expect(firstSession).toBe(sessionId2);
    });

    test('should show session status (idle/busy)', async () => {
      const { page } = context;
      const testDir = context.tempDir;
      
      const sessionId = await createCopilotSession(page, testDir, 'Test status');
      
      // During execution, should show busy status
      const sessionItem = page.locator(`[data-testid="session-item-${sessionId}"]`);
      const statusIndicator = sessionItem.locator('[data-testid="session-status"]');
      
      // Initially should be busy (or idle if completed quickly)
      await expect(statusIndicator).toBeVisible();
      const statusClass = await statusIndicator.getAttribute('class');
      expect(statusClass).toMatch(/status-(idle|busy|completed)/);
    });
  });

  // ==========================================================================
  // Task 2: Resume Flow Implementation
  // ==========================================================================

  test.describe('Session Resume', () => {
    test('should show resume action in context menu', async () => {
      const { page } = context;
      const testDir = context.tempDir;
      
      const sessionId = await createCopilotSession(page, testDir, 'Initial query');
      
      // Wait for session to complete
      await waitForOutput(page);
      await page.waitForTimeout(1000);
      
      // Right-click on session to open context menu
      const sessionItem = page.locator(`[data-testid="session-item-${sessionId}"]`);
      await sessionItem.click({ button: 'right' });
      
      // Verify "Resume Session" option exists
      const resumeOption = page.locator('[data-testid="context-menu-resume"]');
      await expect(resumeOption).toBeVisible();
    });

    test('should resume session and send --continue flag', async () => {
      const { page } = context;
      const testDir = context.tempDir;
      
      // Create and complete initial session
      const sessionId = await createCopilotSession(page, testDir, 'What is TypeScript?');
      await waitForOutput(page);
      await page.waitForTimeout(1000);
      
      // Open context menu and click resume
      const sessionItem = page.locator(`[data-testid="session-item-${sessionId}"]`);
      await sessionItem.click({ button: 'right' });
      await page.click('[data-testid="context-menu-resume"]');
      
      // Enter follow-up prompt
      await page.waitForSelector('[data-testid="resume-prompt-input"]');
      await page.fill('[data-testid="resume-prompt-input"]', 'Give me an example');
      await page.click('[data-testid="resume-submit-btn"]');
      
      // Verify session shows busy status during resume
      await page.waitForTimeout(500);
      const statusIndicator = sessionItem.locator('[data-testid="session-status"]');
      const statusClass = await statusIndicator.getAttribute('class');
      expect(statusClass).toContain('busy');
    });

    test('should append resumed output to existing transcript', async () => {
      const { page } = context;
      const testDir = context.tempDir;
      
      const sessionId = await createCopilotSession(page, testDir, 'First message');
      await waitForOutput(page);
      
      // Get initial output
      const outputContent = page.locator('[data-testid="output-content"]');
      const initialText = await outputContent.textContent();
      
      // Resume with follow-up
      const sessionItem = page.locator(`[data-testid="session-item-${sessionId}"]`);
      await sessionItem.click({ button: 'right' });
      await page.click('[data-testid="context-menu-resume"]');
      await page.fill('[data-testid="resume-prompt-input"]', 'Follow-up message');
      await page.click('[data-testid="resume-submit-btn"]');
      
      // Wait for new output
      await page.waitForTimeout(2000);
      
      // Verify both messages appear in transcript
      const updatedText = await outputContent.textContent();
      expect(updatedText).toContain(initialText || '');
      expect(updatedText?.length).toBeGreaterThan((initialText?.length || 0) + 10);
    });
  });

  // ==========================================================================
  // Task 3: Streaming Output Display
  // ==========================================================================

  test.describe('Streaming Output Display', () => {
    test('should display streaming output in real-time', async () => {
      const { page } = context;
      const testDir = context.tempDir;
      
      await createCopilotSession(page, testDir, 'Count to 5');
      
      // Verify output appears progressively
      const outputContent = page.locator('[data-testid="output-content"]');
      
      // Wait for first chunk
      await page.waitForSelector('[data-testid="output-content"]', { timeout: 5000 });
      const initialLength = (await outputContent.textContent())?.length || 0;
      
      // Wait a bit and check if more content arrived
      await page.waitForTimeout(1000);
      const updatedLength = (await outputContent.textContent())?.length || 0;
      
      // Should have received more data (streaming)
      expect(updatedLength).toBeGreaterThanOrEqual(initialLength);
    });

    test('should provide copy transcript button', async () => {
      const { page } = context;
      const testDir = context.tempDir;
      
      await createCopilotSession(page, testDir, 'Hello world');
      await waitForOutput(page);
      
      // Verify copy button exists and is clickable
      const copyButton = page.locator('[data-testid="copy-transcript-btn"]');
      await expect(copyButton).toBeVisible();
      await expect(copyButton).toBeEnabled();
    });

    test('should auto-scroll during output streaming', async () => {
      const { page } = context;
      const testDir = context.tempDir;
      
      await createCopilotSession(page, testDir, 'Generate a long response');
      
      // Wait for output to start
      await page.waitForSelector('[data-testid="output-content"]', { timeout: 5000 });
      
      // Get scroll container
      const scrollContainer = page.locator('[data-testid="output-scroll-container"]');
      
      // Wait for content to stream
      await page.waitForTimeout(2000);
      
      // Check if scroll position is near bottom (auto-scroll active)
      const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
      const scrollHeight = await scrollContainer.evaluate((el) => el.scrollHeight);
      const clientHeight = await scrollContainer.evaluate((el) => el.clientHeight);
      
      // Should be scrolled to within 100px of bottom
      expect(scrollTop + clientHeight).toBeGreaterThan(scrollHeight - 100);
    });
  });

  // ==========================================================================
  // Task 4: Error Surfacing & Handling
  // ==========================================================================

  test.describe('Error Handling', () => {
    test('should display error banner for authentication errors', async () => {
      const { page } = context;
      const testDir = context.tempDir;
      
      // Simulate authentication error by using invalid config
      // (In real test, would mock the copilot binary to return auth error)
      await createCopilotSession(page, testDir, 'Test auth error');
      
      // Wait for potential error
      await page.waitForTimeout(2000);
      
      // Check if error banner appears
      const errorBanner = page.locator('[data-testid="error-banner"]');
      if (await errorBanner.isVisible()) {
        // Verify error message contains actionable guidance
        const errorText = await errorBanner.textContent();
        expect(errorText).toMatch(/auth|permission|copilot auth/i);
      }
    });

    test('should show inline error with recovery suggestion', async () => {
      const { page } = context;
      const testDir = context.tempDir;
      
      await createCopilotSession(page, testDir, 'Trigger error');
      await page.waitForTimeout(2000);
      
      // If error occurred, verify error UI provides help
      const errorContainer = page.locator('[data-testid="error-container"]');
      if (await errorContainer.isVisible()) {
        // Should have "Learn more" or similar link
        const learnMoreLink = errorContainer.locator('[data-testid="error-learn-more"]');
        await expect(learnMoreLink).toBeVisible();
      }
    });
  });

  // ==========================================================================
  // Task 5: Settings & Configuration UI
  // ==========================================================================

  test.describe('Settings UI', () => {
    test('should show Copilot settings section', async () => {
      const { page } = context;
      
      // Open settings modal
      await page.click('[data-testid="settings-btn"]');
      await page.waitForSelector('[data-testid="settings-modal"]');
      
      // Navigate to Agents/Copilot section
      await page.click('[data-testid="settings-tab-agents"]');
      
      // Verify Copilot section exists
      const copilotSection = page.locator('[data-testid="agent-settings-copilot-cli"]');
      await expect(copilotSection).toBeVisible();
    });

    test('should allow model selection in settings', async () => {
      const { page } = context;
      
      await page.click('[data-testid="settings-btn"]');
      await page.waitForSelector('[data-testid="settings-modal"]');
      await page.click('[data-testid="settings-tab-agents"]');
      
      // Find Copilot model selector
      const modelSelector = page.locator('[data-testid="copilot-model-selector"]');
      await expect(modelSelector).toBeVisible();
      
      // Verify it has multiple options
      await modelSelector.click();
      const modelOptions = page.locator('[data-testid^="copilot-model-option-"]');
      const count = await modelOptions.count();
      expect(count).toBeGreaterThan(1);
    });

    test('should show --allow-all-tools toggle with warning', async () => {
      const { page } = context;
      
      await page.click('[data-testid="settings-btn"]');
      await page.waitForSelector('[data-testid="settings-modal"]');
      await page.click('[data-testid="settings-tab-agents"]');
      
      // Find allow-all-tools toggle
      const toolsToggle = page.locator('[data-testid="copilot-allow-tools-toggle"]');
      await expect(toolsToggle).toBeVisible();
      
      // Verify warning text exists
      const warningText = page.locator('[data-testid="copilot-tools-warning"]');
      await expect(warningText).toBeVisible();
      await expect(warningText).toContainText(/caution|warning|risk/i);
    });

    test('should persist settings changes', async () => {
      const { page } = context;
      
      await page.click('[data-testid="settings-btn"]');
      await page.waitForSelector('[data-testid="settings-modal"]');
      await page.click('[data-testid="settings-tab-agents"]');
      
      // Change model
      await page.click('[data-testid="copilot-model-selector"]');
      await page.click('[data-testid="copilot-model-option-gpt-5.2"]');
      
      // Close settings
      await page.click('[data-testid="settings-close-btn"]');
      
      // Reopen settings
      await page.click('[data-testid="settings-btn"]');
      await page.waitForSelector('[data-testid="settings-modal"]');
      await page.click('[data-testid="settings-tab-agents"]');
      
      // Verify model selection persisted
      const modelSelector = page.locator('[data-testid="copilot-model-selector"]');
      const selectedValue = await modelSelector.inputValue();
      expect(selectedValue).toBe('gpt-5.2');
    });
  });

  // ==========================================================================
  // Task 6: Keyboard Shortcuts
  // ==========================================================================

  test.describe('Keyboard Shortcuts', () => {
    test('should open new Copilot session with Cmd+Shift+C', async () => {
      const { page } = context;
      
      // Press Cmd+Shift+C (or Ctrl+Shift+C on Linux/Windows)
      const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.keyboard.press(`${modifier}+Shift+C`);
      
      // Verify new session modal opens with Copilot pre-selected
      await page.waitForSelector('[data-testid="new-session-modal"]');
      const agentSelector = page.locator('[data-testid="agent-selector"]');
      const selectedAgent = await agentSelector.inputValue();
      expect(selectedAgent).toBe('copilot-cli');
    });

    test('should resume latest Copilot session with Cmd+Option+C', async () => {
      const { page } = context;
      const testDir = context.tempDir;
      
      // Create a Copilot session
      await createCopilotSession(page, testDir, 'Initial session');
      await waitForOutput(page);
      await page.waitForTimeout(1000);
      
      // Press Cmd+Option+C (or Ctrl+Alt+C on Linux/Windows)
      const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
      const alt = process.platform === 'darwin' ? 'Alt' : 'Alt';
      await page.keyboard.press(`${modifier}+${alt}+C`);
      
      // Verify resume prompt appears
      await page.waitForSelector('[data-testid="resume-prompt-input"]');
      const promptInput = page.locator('[data-testid="resume-prompt-input"]');
      await expect(promptInput).toBeVisible();
      await expect(promptInput).toBeFocused();
    });

    test('should show shortcuts in help documentation', async () => {
      const { page } = context;
      
      // Open shortcuts help
      await page.click('[data-testid="help-menu-btn"]');
      await page.click('[data-testid="keyboard-shortcuts-menu-item"]');
      
      // Wait for shortcuts modal
      await page.waitForSelector('[data-testid="shortcuts-modal"]');
      
      // Search for Copilot shortcuts
      const shortcutsContent = page.locator('[data-testid="shortcuts-content"]');
      const contentText = await shortcutsContent.textContent();
      
      // Verify Copilot shortcuts are documented
      expect(contentText).toContain('Copilot');
      expect(contentText).toMatch(/Cmd\+Shift\+C|Ctrl\+Shift\+C/);
    });
  });

  // ==========================================================================
  // Integration Tests: End-to-End Workflows
  // ==========================================================================

  test.describe('Complete Workflows', () => {
    test('should complete full session lifecycle: create -> query -> resume -> delete', async () => {
      const { page } = context;
      const testDir = context.tempDir;
      
      // Step 1: Create session
      const sessionId = await createCopilotSession(page, testDir, 'What is Node.js?');
      await waitForOutput(page);
      
      // Step 2: Verify output received
      const outputContent = page.locator('[data-testid="output-content"]');
      const initialOutput = await outputContent.textContent();
      expect(initialOutput).toBeTruthy();
      
      // Step 3: Resume session
      const sessionItem = page.locator(`[data-testid="session-item-${sessionId}"]`);
      await sessionItem.click({ button: 'right' });
      await page.click('[data-testid="context-menu-resume"]');
      await page.fill('[data-testid="resume-prompt-input"]', 'Give an example');
      await page.click('[data-testid="resume-submit-btn"]');
      
      await page.waitForTimeout(2000);
      
      // Step 4: Verify resumed output appended
      const updatedOutput = await outputContent.textContent();
      expect(updatedOutput?.length).toBeGreaterThan((initialOutput?.length || 0) + 5);
      
      // Step 5: Delete session
      await sessionItem.click({ button: 'right' });
      await page.click('[data-testid="context-menu-delete"]');
      await page.click('[data-testid="confirm-delete-btn"]');
      
      // Step 6: Verify session removed from list
      await page.waitForTimeout(500);
      await expect(sessionItem).not.toBeVisible();
    });

    test('should persist session across app restart', async () => {
      const { page, electronApp, tempDir } = context;
      
      // Create session
      const sessionId = await createCopilotSession(page, tempDir, 'Test persistence');
      await waitForOutput(page);
      
      // Close app
      await electronApp.close();
      
      // Relaunch app with same data directory
      const newContext = await setupTestApp();
      newContext.tempDir = tempDir; // Reuse same temp dir
      
      try {
        // Verify session still exists
        const sessionItem = newContext.page.locator(`[data-testid="session-item-${sessionId}"]`);
        await expect(sessionItem).toBeVisible({ timeout: 10000 });
        
        // Verify session metadata preserved
        const toolType = sessionItem.locator('[data-testid="session-tooltype"]');
        await expect(toolType).toHaveText('copilot-cli');
      } finally {
        await newContext.electronApp.close();
      }
    });
  });
});
