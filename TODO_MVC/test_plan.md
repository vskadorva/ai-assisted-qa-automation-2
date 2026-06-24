# Test Plan: TodoMVC (Playwright Demo)

**Application:** https://demo.playwright.dev/todomvc/  
**Feature under test:** Core todo list operations — add, complete, delete  
**Role:** Senior QA engineer

## UI Elements Reference

| Element | Label / Selector context |
|---------|--------------------------|
| Page heading | `todos` |
| New todo input | Placeholder: `What needs to be done?` |
| Todo item label | Text of the entered todo |
| Item checkbox | Toggle complete / active per item |
| Toggle all | `Mark all as complete` / `Mark all as incomplete` |
| Delete control | `Delete` button (×) on each todo row |
| Item counter | `N item left` / `N items left` |
| Filters | `All`, `Active`, `Completed` |
| Clear completed | `Clear completed` link |

## Acceptance Criteria

1. User can add a todo item to the list
2. User can complete an item
3. User can delete item from the list

---

## Positive Flows

### TC-001 — New todo appears in the list after submission

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- The todo list is empty (no items visible under the main input)

**Steps**
1. Click the **What needs to be done?** input field.
2. Type `Buy groceries`.
3. Press **Enter**.

**Expected result**
- A new todo row appears in the list with label **Buy groceries**.
- The item checkbox is unchecked (active state).
- The footer shows **1 item left**.
- The **What needs to be done?** input is cleared and ready for another entry.

---

### TC-002 — Multiple todos can be added sequentially

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- The todo list is empty

**Steps**
1. Enter `Buy groceries` and press **Enter**.
2. Enter `Walk the dog` and press **Enter**.
3. Enter `Pay electricity bill` and press **Enter**.

**Expected result**
- The list shows three items in order: **Buy groceries**, **Walk the dog**, **Pay electricity bill**.
- The footer shows **3 items left**.
- All three checkboxes are unchecked.

---

### TC-003 — Todo item is marked complete when its checkbox is checked

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- One active todo **Buy groceries** exists in the list

**Steps**
1. Click the checkbox next to **Buy groceries**.

**Expected result**
- **Buy groceries** is visually marked as completed (strikethrough / completed styling).
- The checkbox is checked.
- The footer shows **0 items left**.
- The todo row remains in the list (not removed).

---

### TC-004 — Completed todo returns to active when checkbox is unchecked

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- Todo **Buy groceries** exists and is completed (checkbox checked)

**Steps**
1. Click the checkbox next to **Buy groceries** again.

**Expected result**
- **Buy groceries** returns to active state (no completed styling).
- The checkbox is unchecked.
- The footer shows **1 item left**.

---

### TC-005 — Todo item is removed from the list when deleted

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- One active todo **Buy groceries** exists in the list

**Steps**
1. Hover over the **Buy groceries** row (if required to reveal the delete control).
2. Click the **Delete** button (×) on the **Buy groceries** row.

**Expected result**
- **Buy groceries** is removed from the list.
- The main list area is empty (no todo rows).
- The footer (item counter and filters) is hidden when the list is empty.

---

### TC-006 — Completed todo can be deleted from the list

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- Todo **Walk the dog** exists and is completed

**Steps**
1. Click the **Delete** button on the **Walk the dog** row.

**Expected result**
- **Walk the dog** is removed from the list.
- Remaining todos and counts update accordingly.
- No completed ghost entry remains.

---

### TC-007 — Add, complete, and delete work together in a single session

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- The todo list is empty

**Steps**
1. Add `Buy groceries` and press **Enter**.
2. Add `Walk the dog` and press **Enter**.
3. Check the checkbox for **Buy groceries**.
4. Delete **Walk the dog** via its **Delete** button.

**Expected result**
- Only **Buy groceries** remains in the list, in completed state.
- Footer shows **0 items left**.
- No duplicate or orphaned entries exist.

---

## Negative Flows

### TC-008 — Empty submission does not create a todo

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- The todo list is empty

**Steps**
1. Click the **What needs to be done?** input.
2. Press **Enter** without typing any text.

**Expected result**
- No new todo row is added.
- The list remains empty.
- The footer remains hidden.

---

### TC-009 — Whitespace-only input does not create a todo

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- The todo list is empty

**Steps**
1. Click the **What needs to be done?** input.
2. Type three spaces: `   `.
3. Press **Enter**.

**Expected result**
- No todo is added to the list.
- The list remains empty.
- The input is cleared or retains no visible item in the list.

---

### TC-010 — Deleting a todo does not affect other todos

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- Todos **Buy groceries**, **Walk the dog**, and **Pay electricity bill** exist and are active

**Steps**
1. Delete **Walk the dog** only.

**Expected result**
- **Walk the dog** is removed.
- **Buy groceries** and **Pay electricity bill** remain unchanged and active.
- Footer shows **2 items left**.
- Order of remaining items is preserved.

---

### TC-011 — Completing a todo does not remove it from the list

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- Active todo **Buy groceries** exists

**Steps**
1. Check the checkbox for **Buy groceries**.

**Expected result**
- **Buy groceries** stays visible in the list.
- The item is not deleted automatically upon completion.
- Only visual state and counter change.

---

### TC-012 — Delete control on one row does not delete sibling todos

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- Two active todos exist: **Buy groceries** and **Walk the dog**

**Steps**
1. Click **Delete** on **Buy groceries** only.

**Expected result**
- Only **Buy groceries** is removed.
- **Walk the dog** remains in the list, unchanged.
- Footer shows **1 item left**.

---

### TC-013 — Adding a todo does not auto-complete it

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- The todo list is empty

**Steps**
1. Add `Buy groceries` and press **Enter**.

**Expected result**
- **Buy groceries** appears as an active (unchecked) item.
- It is not marked completed on creation.
- Footer shows **1 item left**, not **0 items left**.

---

## Edge Cases

### TC-014 — Single-character todo is accepted

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- The todo list is empty

**Steps**
1. Enter `A` in **What needs to be done?**.
2. Press **Enter**.

**Expected result**
- A todo labeled **A** appears in the list.
- Counter shows **1 item left**.

---

### TC-015 — Todo with special characters is stored and displayed correctly

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- The todo list is empty

**Steps**
1. Enter `Buy milk & eggs — 2% (urgent!)`.
2. Press **Enter**.

**Expected result**
- The todo appears with the exact text: **Buy milk & eggs — 2% (urgent!)**.
- No HTML injection, broken encoding, or unexpected character stripping occurs.

---

### TC-016 — Duplicate todo text can be added as separate entries

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- Todo **Buy groceries** already exists

**Steps**
1. Enter `Buy groceries` again.
2. Press **Enter**.

**Expected result**
- A second row labeled **Buy groceries** appears.
- Both entries are independent (separate checkboxes and delete buttons).
- Footer count increases by one.

---

### TC-017 — Very long todo text is accepted and displayed

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- The todo list is empty

**Steps**
1. Enter a 200-character string: `Plan quarterly roadmap review with engineering design QA and stakeholder alignment for release candidate validation and deployment sign-off across all environments`.
2. Press **Enter**.

**Expected result**
- The todo is added with the full text preserved (or wrapped visually without data loss).
- The item can be completed and deleted like any other todo.

---

### TC-018 — Leading and trailing spaces in todo text are preserved or trimmed consistently

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- The todo list is empty

**Steps**
1. Enter `  Buy groceries  ` (leading and trailing spaces).
2. Press **Enter**.

**Expected result**
- Either the todo is saved as **Buy groceries** (trimmed) or as `  Buy groceries  ` (preserved).
- Behavior is consistent; no invisible duplicate entries are created due to whitespace alone.

---

### TC-019 — Unicode characters are preserved in todo text

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- The todo list is empty

**Steps**
1. Enter `買い物リスト — compras mañana`.
2. Press **Enter**.

**Expected result**
- The todo displays **買い物リスト — compras mañana** correctly in the list.
- The item can be completed and deleted without corruption.

---

### TC-020 — Completing then uncompleting restores correct active count

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- Two active todos: **Buy groceries**, **Walk the dog**

**Steps**
1. Complete **Buy groceries**.
2. Uncomplete **Buy groceries**.

**Expected result**
- Footer returns to **2 items left**.
- Both items remain active with unchecked checkboxes.

---

### TC-021 — Delete last remaining todo returns app to empty state

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- Exactly one todo **Buy groceries** exists (active or completed)

**Steps**
1. Delete **Buy groceries**.

**Expected result**
- List is empty.
- Footer (counter, filters, **Clear completed**) is not visible.
- **What needs to be done?** input remains available for new entries.

---

### TC-022 — Rapid double Enter does not create duplicate todos unintentionally

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- The todo list is empty

**Steps**
1. Type `Buy groceries` in the input.
2. Press **Enter** twice in quick succession.

**Expected result**
- Exactly one **Buy groceries** todo is created (unless the second Enter submits a new empty line, in which case no extra item is added).
- Footer shows **1 item left**.

---

### TC-023 — Todo added via Enter after paste is handled correctly

**Preconditions**
- Browser is open at https://demo.playwright.dev/todomvc/
- The todo list is empty

**Steps**
1. Paste `Pay electricity bill` into **What needs to be done?**.
2. Press **Enter**.

**Expected result**
- **Pay electricity bill** appears as a single list item.
- Input clears after submission.

---

## AC Traceability Matrix

| Acceptance Criteria | Test Case(s) |
|---------------------|--------------|
| User can add a todo item to the list | TC-001, TC-002, TC-007 |
| User can complete an item | TC-003, TC-004, TC-007 |
| User can delete item from the list | TC-005, TC-006, TC-007 |

---

## Ambiguities and Gaps in the ACs

1. **Whitespace handling** — ACs do not specify whether leading/trailing spaces or whitespace-only input should be rejected, trimmed, or stored as-is.
2. **Duplicate todos** — No rule stated for identical todo text; TodoMVC typically allows duplicates, but product intent is unspecified.
3. **Maximum text length** — No limit defined for todo label length; unclear whether very long strings should be truncated or rejected.
4. **Empty vs. whitespace** — Only "empty" submission is implied; behavior for tabs, newlines, or mixed whitespace is undefined.
5. **Completion side effects** — AC covers completing an item but not whether completed items should remain visible, move sections, or auto-hide under filters.
6. **Delete affordance** — AC does not state whether delete requires hover, keyboard access, or swipe; accessibility expectations are missing.
7. **Persistence** — No AC for local storage / page refresh behavior; todos may or may not survive reload.
8. **Filter interaction** — Completing or deleting while **Active** or **Completed** filter is selected is not covered.
9. **Toggle all / Clear completed** — Related bulk actions exist in TodoMVC but are out of scope for the three ACs; scope boundary is unclear.
10. **Item counter grammar** — Expected behavior for `0 items left` vs. `0 item left` when count is zero is not specified.
11. **Edit todo** — TodoMVC supports double-click edit; not mentioned in ACs — in or out of scope?
12. **Keyboard-only flows** — No AC for adding, completing, or deleting without a mouse.
13. **Error states** — No criteria for failure scenarios (e.g., storage quota exceeded if persistence is expected).
14. **Visual completion state** — AC says "complete" but does not define required UI (strikethrough, checkbox state, filter eligibility).
15. **Order of operations after delete** — Whether focus returns to the input or next item is unspecified.
