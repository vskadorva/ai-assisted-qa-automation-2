# DS-1: Ticket Output — Test Plan: Create New Academic Program (Gherkin)

**Feature:** Create new academic program  
**Role under test:** Admin  
**Scope:** Program creation modal/form from the Programs page

```gherkin
Feature: Create new academic program
  As an admin
  I want to create academic programs from the Programs page
  So that new programs appear in the program list
```

---

## Positive Flows

```gherkin
@TC-001 @High @Positive @AC-NavigateToForm
Scenario: Program creation form opens with required fields
  Given I am logged in as admin
  And I am on the Programs page
  When I click "+ New Program"
  Then I see the program creation form
  And the "Program Name" field is visible and editable
  And the "Description" field is visible and editable
  And the "Create" button is present
```

```gherkin
@TC-002 @High @Positive @AC-SuccessfulCreate
Scenario: Program is created successfully with valid name and description
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "Web Development 2026"
  And I fill in "Description" with "Full-stack web development program"
  And I click "Create"
  Then the modal closes
  And the program list shows "Web Development 2026"
  And the program list updates without requiring a full page refresh
```

```gherkin
@TC-003 @Medium @Positive
Scenario: Program is created with name only and empty description
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "Data Science Fundamentals"
  And I leave "Description" empty
  And I click "Create"
  Then the modal closes
  And the program list shows "Data Science Fundamentals"
  And the program description is empty or shown as blank in the list
```

```gherkin
@TC-004 @High @Positive @AC-EmptyNameValidation
Scenario: Create button is disabled when Program Name is empty
  Given I am logged in as admin
  And I am on the program creation form
  When I leave "Program Name" empty
  And I optionally fill in "Description" with any text
  Then the "Create" button is disabled
  And no program is created
  And the modal remains open
```

```gherkin
@TC-005 @High @Positive @AC-EmptyNameValidation
Scenario: Create button becomes enabled after entering a valid Program Name
  Given I am logged in as admin
  And I am on the program creation form
  And "Program Name" is empty
  And the "Create" button is disabled
  When I fill in "Program Name" with "Cybersecurity Basics"
  Then the "Create" button becomes enabled
  And I can submit the form
```

```gherkin
@TC-006 @Medium @Positive @AC-SuccessfulCreate
Scenario: New program appears at expected position in the list
  Given I am logged in as admin
  And at least one program already exists in the program list
  And I am on the program creation form
  When I fill in "Program Name" with "Mobile App Development 2026"
  And I fill in "Description" with "iOS and Android development track"
  And I click "Create"
  Then the program list shows "Mobile App Development 2026"
  And the new program appears in the list according to product sort rules
```

---

## Negative Flows

```gherkin
@TC-007 @High @Negative
Scenario: Whitespace-only Program Name does not create a program
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "   "
  And I fill in "Description" with "Valid description text"
  And I attempt to click "Create"
  Then the "Create" button remains disabled or a validation error is shown
  And no program is created
  And the modal remains open
  And the program list is unchanged
```

```gherkin
@TC-008 @Medium @Negative
Scenario: Canceling the form does not create a program or change the list
  Given I am logged in as admin
  And I am on the program creation form
  And I note the current program list contents
  When I fill in "Program Name" with "Temporary Program Name"
  And I fill in "Description" with "Temporary description"
  And I close the modal via "Cancel", "X", or an equivalent control
  Then the modal closes
  And no new program is added to the program list
  And the previously entered values are not persisted
```

```gherkin
@TC-009 @High @Negative
Scenario: Non-admin user cannot access program creation
  Given I am logged in as a non-admin user
  And I am on the Programs page if it is accessible to my role
  When I look for the "+ New Program" control
  And I attempt to open the program creation form if the control is visible
  Then the "+ New Program" control is hidden or disabled
    Or access is denied with an appropriate message
  And no program can be created by a non-admin user
```

```gherkin
@TC-010 @High @Negative
Scenario: Unauthenticated user cannot open program creation form
  Given I am not logged in
  When I navigate directly to the Programs page
  And I attempt to access program creation
  Then I am redirected to the login page
  And the program creation form is not accessible
  And no program is created
```

```gherkin
@TC-011 @High @Negative
Scenario: Duplicate Program Name is rejected or handled per business rules
  Given I am logged in as admin
  And the program "Web Development 2026" already exists in the program list
  And I am on the program creation form
  When I fill in "Program Name" with "Web Development 2026"
  And I fill in "Description" with "Another description for duplicate name"
  And I click "Create"
  Then creation is blocked with a clear duplicate-name error
    Or duplicate names are explicitly allowed and a second entry appears
  And the outcome matches the documented business rule
```

```gherkin
@TC-012 @Medium @Negative
Scenario: Failed create does not close modal or corrupt the program list
  Given I am logged in as admin
  And I am on the program creation form
  And a server or API failure can be simulated
  When I fill in "Program Name" with "Cloud Computing 2026"
  And I fill in "Description" with "AWS and Azure fundamentals"
  And I click "Create" while a backend failure is simulated
  Then the modal remains open or reopens with the entered data preserved
  And I see an error message
  And the program list does not show a partial or phantom entry
```

```gherkin
@TC-013 @Medium @Negative
Scenario: Double-clicking Create does not create duplicate programs
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "UI/UX Design 2026"
  And I fill in "Description" with "Design thinking and prototyping"
  And I rapidly double-click "Create"
  Then exactly one program "UI/UX Design 2026" is created
  And the modal closes once
  And no duplicate rows appear in the program list
```

---

## Edge Cases

```gherkin
@TC-014 @Medium @Edge
Scenario: Program Name at minimum valid length is handled correctly
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "A"
  And I fill in "Description" with "Single-letter name boundary test"
  And I click "Create"
  Then if a 1-character name is allowed, the program "A" is created and listed
    Or if minimum length is greater than 1, a validation error is shown
    And the "Create" button is disabled or submission is blocked
```

```gherkin
@TC-015 @Medium @Edge
Scenario: Program Name at maximum allowed length is accepted
  Given I am logged in as admin
  And I am on the program creation form
  And the maximum length for "Program Name" is known
  When I fill in "Program Name" with a 255-character string
  And I fill in "Description" with "Max length boundary test"
  And I click "Create"
  Then the program is created with the full name displayed correctly in the list
  And the name is not truncated without warning
  And no server or client error occurs
```

```gherkin
@TC-016 @Medium @Edge
Scenario: Program Name exceeding maximum length is prevented
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with a 256-character string
  And I fill in "Description" with "Over-limit name test"
  And I attempt to click "Create"
  Then input is blocked at the maximum length or a validation error is shown
  And no program is created
  And I receive clear feedback about the length limit
```

```gherkin
@TC-017 @Medium @Edge
Scenario: Special characters in Program Name are handled correctly
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "Web Dev & Design — 2026 (Cohort #1)"
  And I fill in "Description" with "Special characters test"
  And I click "Create"
  Then the program is created with the exact name preserved
  And the name displays correctly in the program list
  And no HTML injection, broken encoding, or unexpected character stripping occurs
```

```gherkin
@TC-018 @Low @Edge
Scenario: Unicode and international characters are preserved in Program Name and Description
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "プログラミング基礎 2026"
  And I fill in "Description" with "Curso de desarrollo web — año 2026"
  And I click "Create"
  Then the program is created with Unicode characters preserved
  And the program list displays the characters correctly
```

```gherkin
@TC-019 @Medium @Edge
Scenario: Leading and trailing spaces in Program Name are trimmed or rejected consistently
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "  Web Development 2026  "
  And I fill in "Description" with "Trim behavior test"
  And I click "Create"
  Then the name is trimmed to "Web Development 2026" on save
    Or the submission is rejected with a validation error
  And the behavior is consistent and documented
  And no duplicate-looking entries appear due to invisible whitespace
```

```gherkin
@TC-020 @Low @Edge
Scenario: Very long Description is accepted or limited per specification
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "AI Engineering 2026"
  And I fill in "Description" with a 5000-character string
  And I click "Create"
  Then if long descriptions are allowed, the program is created per design
    Or if a limit exists, validation prevents submit or truncates with user notice
  And no silent data loss occurs
```

```gherkin
@TC-021 @Medium @Edge
Scenario: HTML and script tags in Description are sanitized
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "Security Test Program"
  And I fill in "Description" with "<script>alert('xss')</script><b>Bold text</b>"
  And I click "Create"
  And I view the created program in the list or detail view
  Then the script does not execute
  And the description is escaped, sanitized, or rendered safely
  And the program is saved if the description is otherwise valid
```

```gherkin
@TC-022 @Low @Edge
Scenario: Reopening the form after successful create shows empty fields
  Given I am logged in as admin
  And I have just created a program successfully via the program creation form
  When I click "+ New Program" again
  Then the "Program Name" field is empty
  And the "Description" field is empty
  And the previous submission values are not pre-filled
```

```gherkin
@TC-023 @Low @Edge
Scenario: Program creation form can be submitted via keyboard
  Given I am logged in as admin
  And I am on the program creation form
  When I tab to "Program Name" and enter "Accessible Program 2026"
  And I tab to "Description" and enter "Keyboard navigation test"
  And I tab to "Create" and press Enter or Space
  Then the program "Accessible Program 2026" is created successfully
  And focus management after close is logical
```

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
