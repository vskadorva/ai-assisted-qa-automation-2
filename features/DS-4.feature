Feature: Delete program with confirmation
  DS-4 — Admin deletes an academic program with a confirmation step to prevent accidental deletion

  # Happy paths

  @TC-001 @High @AC-DeleteWithConfirmation
  Scenario: Delete program with confirmation removes it from the list
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    When I confirm deletion
    Then "Test Program" is removed from the program list

  @TC-002 @High @AC-CancelDeletion
  Scenario: Cancel program deletion keeps the program in the list
    Given I am logged in as admin
    And I am on the Programs page
    And a program exists in the program list
    When I click the delete icon for that program
    And I see the confirmation dialog
    And I click Cancel
    Then the program still exists in the list
    And the confirmation dialog closes

  @TC-003 @Medium
  Scenario: Confirmation dialog shows the program name being deleted
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Cybersecurity Basics" exists
    When I click the delete icon for "Cybersecurity Basics"
    Then I see a confirmation dialog
    And the dialog references "Cybersecurity Basics" or warns about permanent deletion

  @TC-004 @Medium
  Scenario: Delete button is scoped to the correct program row
    Given I am logged in as admin
    And I am on the Programs page
    And programs "Program Alpha" and "Program Beta" both exist
    When I click the delete icon for "Program Alpha"
    Then I see a confirmation dialog
    When I confirm deletion
    Then "Program Alpha" is removed from the program list
    And "Program Beta" still appears in the program list

  @TC-005 @Medium
  Scenario: Program list updates without a full page refresh after deletion
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Refresh Test Program" exists
    When I delete "Refresh Test Program" with confirmation
    Then the program list updates immediately
    And I remain on the Programs page

  # Negative

  @TC-006 @High
  Scenario: Clicking delete without confirming does not remove the program
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Keep Me Program" exists
    When I click the delete icon for "Keep Me Program"
    And I see the confirmation dialog
    And I dismiss the dialog without confirming
    Then "Keep Me Program" still exists in the program list

  @TC-007 @High
  Scenario: Dismissing the confirmation dialog does not delete the program
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Dismiss Delete Test" exists
    When I click the delete icon for "Dismiss Delete Test"
    And I see the confirmation dialog
    And I dismiss the confirmation dialog
    Then the program still exists in the program list

  @TC-008 @Medium
  Scenario: Failed deletion does not remove the program from the list
    Given I am logged in as admin
    And I am on the Programs page
    And a program "API Failure Delete Test" exists
    And a server or API failure can be simulated for DELETE /api/programs
    When I click the delete icon for "API Failure Delete Test"
    And I confirm deletion while the backend failure is simulated
    Then "API Failure Delete Test" still appears in the program list

  @TC-009 @Medium
  Scenario: Confirming deletion sends exactly one delete request
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Single Delete Request Test" exists
    When I open the delete confirmation for "Single Delete Request Test"
    And I confirm deletion once
    Then "Single Delete Request Test" is removed from the program list
    And exactly one DELETE request was sent

  @TC-010 @High
  Scenario: Unauthenticated user cannot delete a program
    Given I am not logged in
    When I navigate directly to the Programs page
    Then I am redirected to the login page
    And no program can be deleted

  # Edge cases

  @TC-011 @Medium
  Scenario: Delete confirmation works for a program with special characters in the name
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Web Dev & Design — 2026 (Cohort #1)" exists
    When I delete that program with confirmation
    Then "Web Dev & Design — 2026 (Cohort #1)" is removed from the program list

  @TC-012 @Medium
  Scenario: Delete confirmation works for a program with Unicode characters in the name
    Given I am logged in as admin
    And I am on the Programs page
    And a program "プログラミング基礎 2026" exists
    When I delete that program with confirmation
    Then "プログラミング基礎 2026" is removed from the program list

  @TC-013 @Low
  Scenario: Delete confirmation can be completed via the native dialog
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Keyboard Delete Test" exists
    When I open the delete confirmation for "Keyboard Delete Test"
    And I accept the confirmation dialog
    Then "Keyboard Delete Test" is removed from the program list

  @TC-014 @Medium
  Scenario: Deleting the last remaining program shows the empty state
    Given I am logged in as admin
    And I am on the Programs page
    And only one program exists in the environment for this test
    When I delete that program with confirmation
    Then the program list is empty
    And I see the empty state message "No programs yet. Create your first program to get started."

  # Ambiguities and gaps
  # - App uses native window.confirm(), not a Mantine modal — no axe-scannable DOM for the dialog
  # - Native confirm has OK/Cancel only; no header X button — TC-007 maps to dismiss/Cancel
  # - Success feedback beyond list update (toast, undo) not specified
  # - Non-admin delete permissions not covered — only admin credentials available
  # - Error message content on failed DELETE not specified; program row should remain
  # - Whether Escape key dismisses the confirmation dialog is unspecified
