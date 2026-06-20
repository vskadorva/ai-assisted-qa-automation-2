# DS-2: Ticket Output — Test Plan: Create New Academic Program

**Feature:** Create new academic program  
**Role under test:** Admin  
**Scope:** Program creation modal/form from the Programs page

---

## Positive Flows

### TC-001 — Program creation form opens with required fields

**Preconditions**
- User is logged in as admin
- User is on the Programs page

**Steps**
1. Click **+ New Program**
2. Observe the opened modal/form

**Expected result**
- Program creation form is displayed
- **Program Name** field is visible and editable
- **Description** field is visible and editable
- **Create** button is present (state may depend on validation)

**Priority:** High  
**AC coverage:** Navigate to program creation form

---

### TC-002 — Program is created successfully with valid name and description

**Preconditions**
- User is logged in as admin
- Program creation form is open

**Steps**
1. Enter `Web Development 2026` in **Program Name**
2. Enter `Full-stack web development program` in **Description**
3. Click **Create**

**Expected result**
- Modal closes
- Programs list includes **Web Development 2026**
- New program appears without requiring a full page refresh (unless product spec says otherwise)

**Priority:** High  
**AC coverage:** Successfully create a program

---

### TC-003 — Program is created with name only and empty description

**Preconditions**
- User is logged in as admin
- Program creation form is open

**Steps**
1. Enter `Data Science Fundamentals` in **Program Name**
2. Leave **Description** empty
3. Click **Create**

**Expected result**
- Program is created successfully
- Modal closes
- Programs list shows **Data Science Fundamentals**
- Description is empty or shown as blank/placeholder in the list (per UI design)

**Priority:** Medium  
**AC coverage:** Extension of successful create flow

---

### TC-004 — Create button is disabled when Program Name is empty

**Preconditions**
- User is logged in as admin
- Program creation form is open

**Steps**
1. Leave **Program Name** empty
2. Optionally enter text in **Description**
3. Observe **Create** button state

**Expected result**
- **Create** button is disabled
- No program is created
- Modal remains open

**Priority:** High  
**AC coverage:** Validation prevents empty program name

---

### TC-005 — Create button becomes enabled after entering a valid Program Name

**Preconditions**
- User is logged in as admin
- Program creation form is open
- **Program Name** is empty and **Create** is disabled

**Steps**
1. Enter `Cybersecurity Basics` in **Program Name**
2. Observe **Create** button state

**Expected result**
- **Create** button becomes enabled
- User can submit the form

**Priority:** High  
**AC coverage:** Validation prevents empty program name (inverse/positive validation)

---

### TC-006 — New program appears at expected position in the list

**Preconditions**
- User is logged in as admin
- At least one program already exists in the list
- Program creation form is open

**Steps**
1. Enter `Mobile App Development 2026` in **Program Name**
2. Enter `iOS and Android development track` in **Description**
3. Click **Create**
4. Locate the new entry in the Programs list

**Expected result**
- **Mobile App Development 2026** appears in the list
- Sort order matches product rules (e.g., newest first or alphabetical)

**Priority:** Medium

---

## Negative Flows

### TC-007 — Submitting with whitespace-only Program Name does not create a program

**Preconditions**
- User is logged in as admin
- Program creation form is open

**Steps**
1. Enter `   ` (spaces only) in **Program Name**
2. Enter `Valid description text` in **Description**
3. Attempt to click **Create**

**Expected result**
- **Create** remains disabled, **or** validation error is shown and no program is created
- Modal stays open
- Programs list is unchanged

**Priority:** High

---

### TC-008 — Cancel/close does not create a program or change the list

**Preconditions**
- User is logged in as admin
- Program creation form is open
- Note current program count/names in the list

**Steps**
1. Enter `Temporary Program Name` in **Program Name**
2. Enter `Temporary description` in **Description**
3. Close the modal via **Cancel**, **X**, or equivalent control (if available)

**Expected result**
- Modal closes
- No new program is added to the list
- Previously entered values are not persisted

**Priority:** Medium

---

### TC-009 — Non-admin user cannot access program creation

**Preconditions**
- User is logged in as a non-admin role (e.g., instructor or student)
- User navigates to Programs page (if accessible)

**Steps**
1. Look for **+ New Program** control
2. If visible, attempt to open the creation form and create a program

**Expected result**
- **+ New Program** is hidden or disabled, **or**
- Access is denied with appropriate message
- No program can be created by non-admin

**Priority:** High

---

### TC-010 — Unauthenticated user cannot open program creation form

**Preconditions**
- User is not logged in

**Steps**
1. Navigate directly to Programs page URL (if known)
2. Attempt to access program creation

**Expected result**
- User is redirected to login
- Program creation form is not accessible
- No program is created

**Priority:** High

---

### TC-011 — Duplicate Program Name is rejected or handled per business rules

**Preconditions**
- User is logged in as admin
- Program **Web Development 2026** already exists in the list
- Program creation form is open

**Steps**
1. Enter `Web Development 2026` in **Program Name**
2. Enter `Another description for duplicate name` in **Description**
3. Click **Create**

**Expected result**
- Either:
  - Creation is blocked with a clear duplicate-name error, **or**
  - Duplicate names are explicitly allowed and a second entry appears
- Behavior matches documented business rule (only one outcome is valid)

**Priority:** High

---

### TC-012 — Invalid or failed create does not close modal or corrupt list

**Preconditions**
- User is logged in as admin
- Program creation form is open
- Simulate/create conditions for server/API failure if testable (network error, 500)

**Steps**
1. Enter `Cloud Computing 2026` in **Program Name**
2. Enter `AWS and Azure fundamentals` in **Description**
3. Click **Create** while backend failure is simulated

**Expected result**
- Modal remains open (or reopens with entered data preserved)
- User sees an error message
- Programs list does not show a partial or phantom entry

**Priority:** Medium

---

### TC-013 — Double-clicking Create does not create duplicate programs

**Preconditions**
- User is logged in as admin
- Program creation form is open

**Steps**
1. Enter `UI/UX Design 2026` in **Program Name**
2. Enter `Design thinking and prototyping` in **Description**
3. Rapidly double-click **Create**

**Expected result**
- Exactly one program **UI/UX Design 2026** is created
- Modal closes once
- No duplicate rows appear in the list

**Priority:** Medium

---

## Edge Cases

### TC-014 — Program Name at minimum valid length (single character)

**Preconditions**
- User is logged in as admin
- Program creation form is open

**Steps**
1. Enter `A` in **Program Name**
2. Enter `Single-letter name boundary test` in **Description**
3. Click **Create**

**Expected result**
- If 1 character is allowed: program **A** is created and listed
- If minimum length > 1: validation error shown and **Create** disabled or submission blocked

**Priority:** Medium

---

### TC-015 — Program Name at maximum allowed length

**Preconditions**
- User is logged in as admin
- Program creation form is open
- Know max length for **Program Name** (e.g., 255 characters)

**Steps**
1. Enter a name of exactly max length (e.g., 255 × `x`)
2. Enter `Max length boundary test` in **Description**
3. Click **Create**

**Expected result**
- Program is created with full name displayed correctly in list
- No truncation without warning
- No server/client error

**Priority:** Medium

---

### TC-016 — Program Name exceeding maximum length is prevented

**Preconditions**
- User is logged in as admin
- Program creation form is open

**Steps**
1. Enter a name of max length + 1 (e.g., 256 characters)
2. Enter `Over-limit name test` in **Description**
3. Attempt to click **Create**

**Expected result**
- Input is blocked at max length **or** validation error is shown
- Program is not created
- User receives clear feedback about length limit

**Priority:** Medium

---

### TC-017 — Special characters in Program Name are handled correctly

**Preconditions**
- User is logged in as admin
- Program creation form is open

**Steps**
1. Enter `Web Dev & Design — 2026 (Cohort #1)` in **Program Name**
2. Enter `Special characters test` in **Description**
3. Click **Create**

**Expected result**
- Program is created with exact name preserved
- Name displays correctly in list (no HTML injection, broken encoding, or stripped characters unless documented)

**Priority:** Medium

---

### TC-018 — Unicode and international characters in Program Name and Description

**Preconditions**
- User is logged in as admin
- Program creation form is open

**Steps**
1. Enter `プログラミング基礎 2026` in **Program Name**
2. Enter `Curso de desarrollo web — año 2026` in **Description**
3. Click **Create**

**Expected result**
- Program is created with Unicode preserved
- List displays characters correctly

**Priority:** Low

---

### TC-019 — Leading and trailing spaces in Program Name are trimmed or rejected consistently

**Preconditions**
- User is logged in as admin
- Program creation form is open

**Steps**
1. Enter `  Web Development 2026  ` in **Program Name**
2. Enter `Trim behavior test` in **Description**
3. Click **Create**

**Expected result**
- Either trimmed to `Web Development 2026` on save, **or** rejected with validation error
- Behavior is consistent and documented
- No duplicate-looking entries due to invisible whitespace

**Priority:** Medium

---

### TC-020 — Very long Description is accepted or limited per spec

**Preconditions**
- User is logged in as admin
- Program creation form is open

**Steps**
1. Enter `AI Engineering 2026` in **Program Name**
2. Enter a description of 5,000+ characters in **Description**
3. Click **Create**

**Expected result**
- If allowed: program created with full/partial description per design
- If limited: validation prevents submit or truncates with user notice
- No silent data loss

**Priority:** Low

---

### TC-021 — HTML/script tags in Description are sanitized

**Preconditions**
- User is logged in as admin
- Program creation form is open

**Steps**
1. Enter `Security Test Program` in **Program Name**
2. Enter `<script>alert('xss')</script><b>Bold text</b>` in **Description**
3. Click **Create**
4. View the created program in the list/detail view

**Expected result**
- Script does not execute
- Description is escaped/sanitized or rendered safely
- Program still saves if description is otherwise valid

**Priority:** Medium

---

### TC-022 — Reopening form after successful create shows empty fields

**Preconditions**
- User is logged in as admin
- A program was just created successfully via the form

**Steps**
1. Click **+ New Program** again
2. Inspect **Program Name** and **Description** fields

**Expected result**
- Form fields are empty/default
- Previous submission values are not pre-filled

**Priority:** Low

---

### TC-023 — Keyboard accessibility: form can be submitted via keyboard

**Preconditions**
- User is logged in as admin
- Program creation form is open

**Steps**
1. Tab to **Program Name** and enter `Accessible Program 2026`
2. Tab to **Description** and enter `Keyboard navigation test`
3. Tab to **Create** and press Enter/Space

**Expected result**
- Program is created successfully
- Focus management after close is logical (e.g., returns to **+ New Program** or list)

**Priority:** Low

---

## AC Traceability Matrix

| Acceptance Criteria | Test Case(s) |
|---|---|
| Navigate to form with Program Name, Description | TC-001 |
| Successfully create program; modal closes; list updated | TC-002, TC-006 |
| Create disabled when Program Name empty | TC-004, TC-005 |

---

## Ambiguities and Gaps in the ACs

1. **Description required?** ACs only require validation on empty **Program Name**. Unclear whether **Description** is optional, required, or has its own validation.
2. **Whitespace-only name** Not specified. Should `   ` disable **Create** or show an error?
3. **Duplicate Program Name** No rule stated — unique names vs. allowed duplicates.
4. **Max length** No limits given for **Program Name** or **Description**.
5. **Trim behavior** Unclear whether leading/trailing spaces are trimmed on save.
6. **List sort order** After create, position of new program in list is unspecified.
7. **Modal dismiss controls** AC mentions modal closes on success only; cancel/X/Escape behavior not defined.
8. **Non-admin access** AC assumes admin; no criteria for other roles or unauthenticated users.
9. **Error handling** No AC for API/network failures, timeouts, or duplicate-submit protection.
10. **Field types** Unclear if **Description** is single-line or multiline; affects length and formatting tests.
11. **Success feedback** No toast/confirmation message specified beyond modal close and list update.
12. **Program list refresh** Unclear if list updates automatically or requires manual refresh.
13. **Special characters / Unicode** Not mentioned; encoding and XSS handling unknown.
14. **Minimum name length** Only "empty" is covered; single-character or minimum-length rules not stated.
15. **Persistence of draft** Behavior on accidental modal close with partially filled form is undefined.
