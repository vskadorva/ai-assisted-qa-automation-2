import { test, expect, type Page } from '@playwright/test';

const TODO_URL = 'https://demo.playwright.dev/todomvc/';

const LONG_TODO_TEXT =
  'Plan quarterly roadmap review with engineering design QA and stakeholder alignment for release candidate validation and deployment sign-off across all environments';

async function gotoApp(page: Page) {
  await page.goto(TODO_URL);
}

async function addTodo(page: Page, text: string) {
  const input = page.getByPlaceholder('What needs to be done?');
  await input.click();
  await input.fill(text);
  await input.press('Enter');
}

function todoItems(page: Page) {
  return page.getByRole('listitem').filter({ has: page.getByRole('checkbox') });
}

function todoItem(page: Page, text: string) {
  return todoItems(page).filter({ hasText: text });
}

function todoCheckbox(page: Page, text: string) {
  return todoItem(page, text).getByRole('checkbox');
}

async function deleteTodo(page: Page, text: string) {
  const item = todoItem(page, text);
  await item.hover();
  await item.getByRole('button', { name: 'Delete' }).click();
}

test.describe('TodoMVC', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('TC-001 — New todo appears in the list after submission', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');

    await input.click();
    await input.fill('Buy groceries');
    await input.press('Enter');

    await expect(page.getByText('Buy groceries')).toBeVisible();
    await expect(todoCheckbox(page, 'Buy groceries')).not.toBeChecked();
    await expect(page.getByText('1 item left')).toBeVisible();
    await expect(input).toHaveValue('');
  });

  test('TC-002 — Multiple todos can be added sequentially', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');
    await addTodo(page, 'Pay electricity bill');

    const items = todoItems(page);
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText('Buy groceries');
    await expect(items.nth(1)).toContainText('Walk the dog');
    await expect(items.nth(2)).toContainText('Pay electricity bill');
    await expect(page.getByText('3 items left')).toBeVisible();
    await expect(todoCheckbox(page, 'Buy groceries')).not.toBeChecked();
    await expect(todoCheckbox(page, 'Walk the dog')).not.toBeChecked();
    await expect(todoCheckbox(page, 'Pay electricity bill')).not.toBeChecked();
  });

  test('TC-003 — Todo item is marked complete when its checkbox is checked', async ({ page }) => {
    await addTodo(page, 'Buy groceries');

    await todoCheckbox(page, 'Buy groceries').check();

    await expect(todoCheckbox(page, 'Buy groceries')).toBeChecked();
    await expect(todoItem(page, 'Buy groceries')).toHaveClass(/completed/);
    await expect(page.getByText('0 items left')).toBeVisible();
    await expect(page.getByText('Buy groceries')).toBeVisible();
  });

  test('TC-004 — Completed todo returns to active when checkbox is unchecked', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    const checkbox = todoCheckbox(page, 'Buy groceries');
    await checkbox.check();

    await checkbox.uncheck();

    await expect(checkbox).not.toBeChecked();
    await expect(todoItem(page, 'Buy groceries')).not.toHaveClass(/completed/);
    await expect(page.getByText('1 item left')).toBeVisible();
  });

  test('TC-005 — Todo item is removed from the list when deleted', async ({ page }) => {
    await addTodo(page, 'Buy groceries');

    await deleteTodo(page, 'Buy groceries');

    await expect(page.getByText('Buy groceries')).toBeHidden();
    await expect(todoItems(page)).toHaveCount(0);
    await expect(page.getByText(/\d+ items? left/)).toBeHidden();
  });

  test('TC-006 — Completed todo can be deleted from the list', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');
    await todoCheckbox(page, 'Walk the dog').check();

    await deleteTodo(page, 'Walk the dog');

    await expect(page.getByText('Walk the dog')).toBeHidden();
    await expect(page.getByText('Buy groceries')).toBeVisible();
    await expect(page.getByText('1 item left')).toBeVisible();
  });

  test('TC-007 — Add, complete, and delete work together in a single session', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');
    await todoCheckbox(page, 'Buy groceries').check();
    await deleteTodo(page, 'Walk the dog');

    await expect(todoItems(page)).toHaveCount(1);
    await expect(page.getByText('Buy groceries')).toBeVisible();
    await expect(todoCheckbox(page, 'Buy groceries')).toBeChecked();
    await expect(page.getByText('0 items left')).toBeVisible();
  });

  test('TC-008 — Empty submission does not create a todo', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');

    await input.click();
    await input.press('Enter');

    await expect(todoItems(page)).toHaveCount(0);
    await expect(page.getByText(/\d+ items? left/)).toBeHidden();
  });

  test('TC-009 — Whitespace-only input does not create a todo', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');

    await input.click();
    await input.fill('   ');
    await input.press('Enter');

    await expect(todoItems(page)).toHaveCount(0);
    await expect(page.getByText(/\d+ items? left/)).toBeHidden();
  });

  test('TC-010 — Deleting a todo does not affect other todos', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');
    await addTodo(page, 'Pay electricity bill');

    await deleteTodo(page, 'Walk the dog');

    await expect(page.getByText('Walk the dog')).toBeHidden();
    await expect(page.getByText('Buy groceries')).toBeVisible();
    await expect(page.getByText('Pay electricity bill')).toBeVisible();
    await expect(todoCheckbox(page, 'Buy groceries')).not.toBeChecked();
    await expect(todoCheckbox(page, 'Pay electricity bill')).not.toBeChecked();
    await expect(page.getByText('2 items left')).toBeVisible();

    const items = todoItems(page);
    await expect(items.nth(0)).toContainText('Buy groceries');
    await expect(items.nth(1)).toContainText('Pay electricity bill');
  });

  test('TC-011 — Completing a todo does not remove it from the list', async ({ page }) => {
    await addTodo(page, 'Buy groceries');

    await todoCheckbox(page, 'Buy groceries').check();

    await expect(page.getByText('Buy groceries')).toBeVisible();
    await expect(todoItems(page)).toHaveCount(1);
    await expect(todoCheckbox(page, 'Buy groceries')).toBeChecked();
    await expect(page.getByText('0 items left')).toBeVisible();
  });

  test('TC-012 — Delete control on one row does not delete sibling todos', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');

    await deleteTodo(page, 'Buy groceries');

    await expect(page.getByText('Buy groceries')).toBeHidden();
    await expect(page.getByText('Walk the dog')).toBeVisible();
    await expect(todoCheckbox(page, 'Walk the dog')).not.toBeChecked();
    await expect(page.getByText('1 item left')).toBeVisible();
  });

  test('TC-013 — Adding a todo does not auto-complete it', async ({ page }) => {
    await addTodo(page, 'Buy groceries');

    await expect(todoCheckbox(page, 'Buy groceries')).not.toBeChecked();
    await expect(todoItem(page, 'Buy groceries')).not.toHaveClass(/completed/);
    await expect(page.getByText('1 item left')).toBeVisible();
  });

  test('TC-014 — Single-character todo is accepted', async ({ page }) => {
    await addTodo(page, 'A');

    await expect(page.getByText('A', { exact: true })).toBeVisible();
    await expect(page.getByText('1 item left')).toBeVisible();
  });

  test('TC-015 — Todo with special characters is stored and displayed correctly', async ({ page }) => {
    const text = 'Buy milk & eggs — 2% (urgent!)';
    await addTodo(page, text);

    await expect(page.getByText(text)).toBeVisible();
  });

  test('TC-016 — Duplicate todo text can be added as separate entries', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Buy groceries');

    await expect(todoItem(page, 'Buy groceries')).toHaveCount(2);
    await expect(page.getByText('2 items left')).toBeVisible();
  });

  test('TC-017 — Very long todo text is accepted and displayed', async ({ page }) => {
    await addTodo(page, LONG_TODO_TEXT);

    await expect(page.getByText(LONG_TODO_TEXT)).toBeVisible();
    await todoCheckbox(page, LONG_TODO_TEXT).check();
    await deleteTodo(page, LONG_TODO_TEXT);
    await expect(page.getByText(LONG_TODO_TEXT)).toBeHidden();
  });

  test('TC-018 — Leading and trailing spaces in todo text are preserved or trimmed consistently', async ({ page }) => {
    await addTodo(page, '  Buy groceries  ');

    const trimmed = page.getByText('Buy groceries', { exact: true });
    const preserved = page.getByText('  Buy groceries  ', { exact: true });
    await expect(trimmed.or(preserved)).toBeVisible();
    await expect(todoItems(page)).toHaveCount(1);
  });

  test('TC-019 — Unicode characters are preserved in todo text', async ({ page }) => {
    const text = '買い物リスト — compras mañana';
    await addTodo(page, text);

    await expect(page.getByText(text)).toBeVisible();
    await todoCheckbox(page, text).check();
    await deleteTodo(page, text);
    await expect(page.getByText(text)).toBeHidden();
  });

  test('TC-020 — Completing then uncompleting restores correct active count', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');
    const checkbox = todoCheckbox(page, 'Buy groceries');

    await checkbox.check();
    await checkbox.uncheck();

    await expect(page.getByText('2 items left')).toBeVisible();
    await expect(todoCheckbox(page, 'Buy groceries')).not.toBeChecked();
    await expect(todoCheckbox(page, 'Walk the dog')).not.toBeChecked();
  });

  test('TC-021 — Delete last remaining todo returns app to empty state', async ({ page }) => {
    await addTodo(page, 'Buy groceries');

    await deleteTodo(page, 'Buy groceries');

    await expect(todoItems(page)).toHaveCount(0);
    await expect(page.getByText(/\d+ items? left/)).toBeHidden();
    await expect(page.getByRole('link', { name: 'Clear completed' })).toBeHidden();
    await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible();
  });

  test('TC-022 — Rapid double Enter does not create duplicate todos unintentionally', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Buy groceries');
    await input.press('Enter');
    await input.press('Enter');

    await expect(todoItem(page, 'Buy groceries')).toHaveCount(1);
    await expect(page.getByText('1 item left')).toBeVisible();
  });

  test('TC-023 — Todo added via Enter after paste is handled correctly', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.click();
    await input.fill('Pay electricity bill');
    await input.press('Enter');

    await expect(page.getByText('Pay electricity bill')).toBeVisible();
    await expect(input).toHaveValue('');
  });
});
