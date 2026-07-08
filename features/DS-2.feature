Feature: Edit existing program details
  DS-2 — Admin edits an existing academic program from the Programs page

  # Happy paths

  @TC-001 @High @AC-OpenForEditing
  Scenario: Edit form opens pre-populated with the program's current data
    Given I am logged in as admin
    And I am on the Programs page
    And the program "Web Development 2026" exists with description "Full-stack web development program"
    When I click "Edit" on the row for "Web Development 2026"
    Then I see a dialog titled "Edit Program"
    And the "Program Name" field shows "Web Development 2026"
    And the "Description" field shows "Full-stack web development program"
    And the "Save" button is present
    And the "Cancel" button is present
    And a close ("X") control is present in the dialog header

  @TC-002 @High @AC-EditName
  Scenario: Program name is updated successfully
    Given I am logged in as admin
    And I am on the Programs page
    And the program "Web Development 2026" exists
    And I am editing "Web Development 2026"
    When I change "Program Name" to "Web Development 2026 - Updated"
    And I click "Save"
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated"
    And "Web Development 2026" no longer appears in the program list
    And the program list updates without requiring a full page refresh

  @TC-003 @High @AC-PreserveUnchanged
  Scenario: Updating only Description preserves Program Name
    Given I am logged in as admin
    And I am on the Programs page
    And the program "Web Development 2026" exists with description "Full-stack web development program"
    And I am editing "Web Development 2026"
    When I leave "Program Name" unchanged
    And I change "Description" to "Updated full-stack curriculum for 2026"
    And I click "Save"
    Then the modal closes
    And the program list shows "Web Development 2026"
    And the description "Updated full-stack curriculum for 2026" appears under the program name in the list
    And no other program fields are changed

  @TC-004 @Medium
  Scenario: Both Program Name and Description are updated together
    Given I am logged in as admin
    And I am on the Programs page
    And the program "Data Science Fundamentals" exists with description "Introductory data science track"
    And I am editing "Data Science Fundamentals"
    When I change "Program Name" to "Data Science Fundamentals 2026"
    And I change "Description" to "Expanded curriculum with machine learning modules"
    And I click "Save"
    Then the modal closes
    And the program list shows "Data Science Fundamentals 2026"
    And the description "Expanded curriculum with machine learning modules" appears under the program name in the list

  @TC-005 @Medium
  Scenario: Description can be cleared on edit
    Given I am logged in as admin
    And I am on the Programs page
    And the program "Cybersecurity Basics" exists with description "Foundational security concepts"
    And I am editing "Cybersecurity Basics"
    When I leave "Program Name" unchanged
    And I clear "Description"
    And I click "Save"
    Then the modal closes
    And the program list shows "Cybersecurity Basics"
    And no description paragraph is shown under the program name in the list

  @TC-006 @Medium
  Scenario: Save button becomes enabled after changing Program Name
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    And the "Save" button is disabled or enabled based on the current form state
    When I change "Program Name" to "Web Development 2026 - Revised"
    Then the "Save" button becomes enabled
    And I can submit the form

  # Negative

  @TC-007 @High
  Scenario: Save is blocked when Program Name is cleared
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I clear "Program Name"
    Then the "Save" button is disabled
    And no update is saved
    And the modal remains open
    And the program list still shows "Web Development 2026"

  @TC-008 @High
  Scenario: Whitespace-only Program Name does not save changes
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change "Program Name" to "   "
    Then the "Save" button remains disabled or save is blocked with validation
    And no update is saved
    And the program list still shows "Web Development 2026"

  @TC-009 @Medium
  Scenario: Canceling the edit form does not persist changes
    Given I am logged in as admin
    And I am on the Programs page
    And the program "Web Development 2026" exists with description "Full-stack web development program"
    And I am editing "Web Development 2026"
    When I change "Program Name" to "Temporary Rename"
    And I change "Description" to "Temporary description"
    And I click "Cancel"
    Then the modal closes
    And the program list still shows "Web Development 2026"
    And the description "Full-stack web development program" is unchanged

  @TC-010 @Medium
  Scenario: Closing the edit form via the header X button does not persist changes
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change "Program Name" to "X Close Test Rename"
    And I click the header close ("X") button
    Then the modal closes
    And the program list still shows "Web Development 2026"
    And "X Close Test Rename" does not appear in the program list

  @TC-011 @High
  Scenario: Renaming to an existing Program Name is rejected with an error
    Given I am logged in as admin
    And the program "Web Development 2026" exists
    And the program "Data Science Fundamentals" exists
    And I am editing "Web Development 2026"
    When I change "Program Name" to "Data Science Fundamentals"
    And I click "Save"
    Then the update is blocked with a clear duplicate-name error
    And the modal remains open or reopens with the entered data preserved
    And exactly one program named "Data Science Fundamentals" remains in the list
    And "Web Development 2026" is still present in the list

  @TC-012 @High
  Scenario: Non-admin user cannot edit a program
    Given I am logged in as a non-admin user
    And I am on the Programs page if it is accessible to my role
    And a program "Web Development 2026" exists
    When I look for the "Edit" control on that program row
    Then the "Edit" control is hidden or disabled
    And no program details can be changed by a non-admin user

  @TC-013 @High
  Scenario: Unauthenticated user cannot open the edit form
    Given I am not logged in
    When I navigate directly to the Programs page
    Then I am redirected to the login page
    And the edit form is not accessible
    And no program is updated

  @TC-014 @Medium
  Scenario: Failed save does not close modal or corrupt the program list
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    And a server or API failure can be simulated
    When I change "Program Name" to "Cloud Computing 2026"
    And I click "Save" while a backend failure is simulated
    Then the modal remains open or reopens with the entered data preserved
    And I see an error message
    And the program list still shows "Web Development 2026"
    And no partial or phantom update appears in the list

  @TC-015 @Medium
  Scenario: Double-clicking Save applies exactly one update
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change "Program Name" to "UI/UX Design 2026"
    And I rapidly double-click "Save"
    Then exactly one update is applied
    And the modal closes once
    And the program list shows "UI/UX Design 2026" exactly once
    And no duplicate PATCH requests corrupt the program data

  @TC-016 @Medium
  Scenario: Saving with no changes does not corrupt program data
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    And I do not change any field values
    When I click "Save"
    Then either the modal closes with no visible change in the list
    Or save is disabled and no request is sent
    And the program list still shows "Web Development 2026" with its original description

  # Edge cases

  @TC-017 @Medium
  Scenario: Program Name at maximum allowed length (100 characters) is accepted on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change "Program Name" to a 100-character string
    And I click "Save"
    Then the modal closes
    And the program list shows the full 100-character name correctly
    And no server or client error occurs

  @TC-018 @Medium
  Scenario: Program Name exceeding 100 characters is rejected on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change "Program Name" to a 101-character string
    And I click "Save"
    Then the modal remains open or a validation error is shown
    And no update is saved
    And the program list still shows "Web Development 2026"
    And the user receives clear feedback about the length limit

  @TC-019 @Medium
  Scenario: Special characters in Program Name are preserved on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change "Program Name" to "Web Dev & Design — 2026 (Cohort #1)"
    And I click "Save"
    Then the modal closes
    And the program list shows the exact updated name
    And no HTML injection, broken encoding, or unexpected character stripping occurs

  @TC-020 @Low
  Scenario: Unicode and international characters are preserved on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change "Program Name" to "プログラミング基礎 2026"
    And I change "Description" to "Curso de desarrollo web — año 2026"
    And I click "Save"
    Then the modal closes
    And the program list displays the Unicode characters correctly in both name and description

  @TC-021 @Medium
  Scenario: Leading and trailing spaces in Program Name are trimmed on save
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change "Program Name" to "  Web Development 2026 - Updated  "
    And I click "Save"
    Then the program is saved with name "Web Development 2026 - Updated"
    And the program list shows "Web Development 2026 - Updated" without leading or trailing spaces

  @TC-022 @Low
  Scenario: Description at maximum length (500 characters) is accepted on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change "Description" to a 500-character string
    And I click "Save"
    Then the modal closes
    And the updated description is shown correctly in the program list

  @TC-023 @Medium
  Scenario: Description exceeding 500 characters is rejected on edit
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change "Description" to a 501-character string
    And I click "Save"
    Then the modal remains open or a validation error is shown
    And no update is saved
    And the user receives clear feedback about the length limit

  @TC-024 @Medium
  Scenario: HTML and script tags in Description are stored as plain text without execution
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change "Description" to "<script>alert('xss')</script><b>Bold text</b>"
    And I click "Save"
    And I view the updated program in the list
    Then the script does not execute
    And the description is displayed as plain text including the literal "<script>" tags

  @TC-025 @Medium
  Scenario: HTML and script tags in Program Name are stored as plain text without execution
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I change "Program Name" to "<script>alert('xss')</script>Security Test"
    And I click "Save"
    And I view the updated program in the list
    Then the script does not execute
    And the name is displayed as plain text including the literal "<script>" tags

  @TC-026 @Low
  Scenario: Edit form can be submitted via keyboard
    Given I am logged in as admin
    And I am editing "Web Development 2026"
    When I tab to "Program Name" and change it to "Accessible Edit 2026"
    And I tab to "Save" and press Enter or Space
    Then the program "Accessible Edit 2026" is saved successfully
    And focus management after close is logical

  @TC-027 @Medium
  Scenario: Renaming a program does not leave stale old name visible in the list
    Given I am logged in as admin
    And the program "Web Development 2026" exists
    And I am editing "Web Development 2026"
    When I change "Program Name" to "Web Development 2026 - Updated"
    And I click "Save"
    Then the program list shows "Web Development 2026 - Updated"
    And no stale reference to "Web Development 2026" remains visible anywhere on the Programs page

  # Ambiguities and gaps
  # - Edit control: ticket says "edit icon" but DS-1 list uses an "Edit" text button; selector may vary by build
  # - Dialog title: assumed "Edit Program" — not specified in ticket
  # - Save button enablement: ticket does not state whether Save is disabled with no changes (TC-016)
  # - Empty name validation: not documented in DS-2 AC; inferred from DS-1 create behavior (TC-007)
  # - Duplicate name on edit: not in DS-2 AC; inferred from DS-1 and linked bugs DS-11, DS-55 (TC-011)
  # - Max length limits: DS-2 silent on limits; inferred from DS-1 (100 name / 500 description)
  # - Non-admin access (TC-012): only admin credentials available; non-admin behavior not verified
  # - API failure UX (TC-014): error message content and modal state on failure not specified
  # - Known bugs on test.didaxis.studio: duplicate names accepted, names >100 chars accepted,
  #   double-click sends duplicate PATCH, stale list after rename (DS-9), no visible duplicate error (DS-11)
