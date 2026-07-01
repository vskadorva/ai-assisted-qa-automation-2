# DS-1: Ticket Output — Test Plan: Create New Academic Program (Gherkin)

**Jira:** [DS-1](https://legionqaschool.atlassian.net/browse/DS-1) — Create new academic program  
**Story:** As an admin user, I want to create a new academic program so that I can begin designing its curriculum structure.  
**Role under test:** Admin  
**Scope:** Program creation modal from the Programs page (`/programs`)

**Acceptance Criteria (from Jira):**

1. Navigate to Programs page → click "+ New Program" → form shows **Program Name** and **Description**
2. Fill name + description → click **Create** → modal closes → program appears in list
3. Empty **Program Name** → **Create** button is disabled

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
  Then I see a dialog titled "New Program"
  And the "Program Name" field is visible and editable with placeholder "e.g. Computer Science BSc"
  And the "Description" field is visible and editable with placeholder "Brief description"
  And the "Create" button is present and disabled
  And the "Cancel" button is present
  And a close ("X") control is present in the dialog header
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
  And the description "Full-stack web development program" appears under the program name in the list
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
  And no description paragraph is shown under the program name in the list
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
Scenario: New program appears at the top of the program list
  Given I am logged in as admin
  And at least one program already exists in the program list
  And I note the first program currently shown in the list
  And I am on the program creation form
  When I fill in "Program Name" with "Mobile App Development 2026"
  And I fill in "Description" with "iOS and Android development track"
  And I click "Create"
  Then the program list shows "Mobile App Development 2026"
  And "Mobile App Development 2026" is the first row in the program table
```

```gherkin
@TC-024 @Medium @Positive
Scenario: Programs page displays program list with management actions
  Given I am logged in as admin
  When I navigate to the Programs page
  Then I see the heading "Programs"
  And I see the subtitle "Manage academic programs and semesters"
  And I see a program table with a "Program" column header
  And each program row has "Edit" and "Delete" action buttons
  And I see the hint "Select a program to manage semesters"
```

```gherkin
@TC-025 @Low @Positive
Scenario: Program creation form includes optional AI Generation Config fields
  Given I am logged in as admin
  And I am on the program creation form
  Then I see a "Show AI Generation Config" section toggle
  And I see optional fields for Total Program Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas, and Sync/Async Ratio
  And I can create a program by filling only "Program Name" without completing AI config fields
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
  Then the "Create" button remains disabled
  And no program is created
  And the modal remains open
  And the program list is unchanged
```

```gherkin
@TC-008 @Medium @Negative
Scenario: Canceling or closing the form does not create a program
  Given I am logged in as admin
  And I am on the program creation form
  And I note the current program list contents
  When I fill in "Program Name" with "Temporary Program Name"
  And I fill in "Description" with "Temporary description"
  And I close the modal via "Cancel", the header "X" button, or an equivalent control
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
  Then I am redirected to the login page
  And the program creation form is not accessible
  And the "+ New Program" button is not visible
  And no program is created
```

```gherkin
@TC-011 @High @Negative @ValidationRules
Scenario: Duplicate Program Name is rejected with an error
  Given I am logged in as admin
  And the program "Web Development 2026" already exists in the program list
  And I am on the program creation form
  When I fill in "Program Name" with "Web Development 2026"
  And I fill in "Description" with "Another description for duplicate name"
  And I click "Create"
  Then creation is blocked with a clear duplicate-name error (400/409)
  And exactly one program with that name remains in the list
  And no second row is created
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
@TC-013 @Medium @Negative @AC-SuccessfulCreate
Scenario: Double-clicking Create creates exactly one program
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "UI/UX Design 2026"
  And I fill in "Description" with "Design thinking and prototyping"
  And I rapidly double-click "Create"
  Then exactly one program "UI/UX Design 2026" is created
  And the modal closes once
  And no duplicate rows appear in the program list
```

```gherkin
@TC-026 @Medium @Negative
Scenario: Closing the form via the header X button does not create a program
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "X Close Test Program"
  And I click the header close ("X") button
  Then the modal closes
  And "X Close Test Program" does not appear in the program list
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
@TC-015 @Medium @Edge @ValidationRules
Scenario: Program Name at maximum allowed length (100 characters) is accepted
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with a 100-character string
  And I fill in "Description" with "Max length boundary test"
  And I click "Create"
  Then the program is created with the full name displayed correctly in the list
  And no server or client error occurs
```

```gherkin
@TC-016 @Medium @Edge @ValidationRules
Scenario: Program Name exceeding 100 characters is rejected
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with a 101-character string
  And I fill in "Description" with "Over-limit name test"
  And I click "Create"
  Then the modal remains open or a validation error is shown
  And no program is created
  And the user receives clear feedback about the length limit
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
  And the program list displays the characters correctly in both name and description
```

```gherkin
@TC-019 @Medium @Edge
Scenario: Leading and trailing spaces in Program Name are trimmed on save
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "  Web Development 2026  "
  And I fill in "Description" with "Trim behavior test"
  And I click "Create"
  Then the program is saved with name "Web Development 2026"
  And the program list shows "Web Development 2026" without leading or trailing spaces
  And no duplicate-looking entries appear due to invisible whitespace
```

```gherkin
@TC-020 @Low @Edge @ValidationRules
Scenario: Description at maximum length (500 characters) is accepted
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "AI Engineering 2026"
  And I fill in "Description" with a 500-character string
  And I click "Create"
  Then the program is created successfully
```

```gherkin
@TC-027 @Medium @Edge @ValidationRules
Scenario: Description exceeding 500 characters is rejected
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "Long Description Reject Test"
  And I fill in "Description" with a 501-character string
  And I click "Create"
  Then the modal remains open or a validation error is shown
  And no program is created
  And the user receives clear feedback about the length limit
```

```gherkin
@TC-021 @Medium @Edge
Scenario: HTML and script tags in Description are stored as plain text without execution
  Given I am logged in as admin
  And I am on the program creation form
  When I fill in "Program Name" with "Security Test Program"
  And I fill in "Description" with "<script>alert('xss')</script><b>Bold text</b>"
  And I click "Create"
  And I view the created program in the list
  Then the script does not execute
  And the description is displayed as plain text including the literal "<script>" tags
  And the program is saved with the description text visible in the list
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
| Navigate to form with Program Name, Description | TC-001, TC-025 |
| Successfully create program; modal closes; list updated | TC-002, TC-006, TC-024 |
| Create disabled when Program Name empty | TC-004, TC-005, TC-007 |

---

## Observed App Behavior (Playwright MCP — test.didaxis.studio)

| Area | Observed behavior |
|---|---|
| Programs page | Heading "Programs", subtitle "Manage academic programs and semesters", table with "Program" column, Edit/Delete per row, hint "Select a program to manage semesters" |
| Modal | `dialog` titled "New Program"; Cancel + header X close; Create disabled until valid name entered |
| List update | New programs prepended to top of table without page refresh |
| Description | Optional; shown as second `<p>` under program name when provided |
| Duplicate names | **Bug:** second program created; no 400/409 error (see Confluence Validation Rules) |
| Trim | Leading/trailing spaces trimmed on save |
| Max name length | **Bug:** names >100 characters accepted (Field Definitions limit: 100) |
| Max description length | **Bug:** descriptions >500 characters accepted (Field Definitions limit: 500) |
| HTML in description | Stored and rendered as plain text; script does not execute |
| Double-click Create | **Bug:** double-click creates two programs (violates DS-1 AC Successful create) |
| AI config | Optional fields present (Total Program Hours, session/exam defaults, audience, focus areas, sync/async slider); not required for create |
| Auth | Unauthenticated `/programs` redirects to `/login`; "+ New Program" hidden |

---

## Remaining Ambiguities

1. **Non-admin access (TC-009)** — Only admin credentials available; non-admin behavior not verified on live app.
2. **Single-character name (TC-014)** — Minimum length rule not documented; requires runtime check.
3. **API failure UX (TC-012)** — Error message content and modal state on failure not verified on live app.
4. **AI config toggle** — Section labeled "Show AI Generation Config" but fields are present in the accessibility tree; collapse/expand behavior unclear.
5. **Success feedback** — No toast/confirmation beyond modal close and list update observed.
