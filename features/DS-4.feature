Feature: Delete program with confirmation
  DS-4 — Admin deletes a program they no longer need, with a confirmation step to prevent accidental deletion

  # Happy paths

  @TC-001 @High @AC-DeleteWithConfirmation
  Scenario: Delete program with confirmation
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    When I confirm deletion
    Then "Test Program" is removed from the program list

  @TC-002 @High @AC-CancelDeletion
  Scenario: Cancel program deletion
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Cancel Delete Program" exists
    When I click the delete icon for "Cancel Delete Program"
    Then I see a confirmation dialog
    When I click Cancel
    Then the confirmation dialog closes
    And "Cancel Delete Program" still exists in the program list

  # Negative

  @TC-003 @High
  Scenario: Closing the confirmation dialog without confirming does not delete the program
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Dismiss Delete Program" exists
    When I click the delete icon for "Dismiss Delete Program"
    And I see a confirmation dialog
    When I dismiss the confirmation dialog without confirming
    Then "Dismiss Delete Program" still exists in the program list

  @TC-004 @High
  Scenario: Delete confirmation is required — program is not removed until Confirm is clicked
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Guard Delete Program" exists
    When I click the delete icon for "Guard Delete Program"
    Then I see a confirmation dialog
    And "Guard Delete Program" still exists in the program list
    And the program is not deleted until I confirm

  # Edge cases

  @TC-005 @Medium
  Scenario: Delete a program with special characters in the name
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Web Dev & Design — Delete (Cohort #1)" exists
    When I click the delete icon for "Web Dev & Design — Delete (Cohort #1)"
    And I confirm deletion
    Then "Web Dev & Design — Delete (Cohort #1)" is removed from the program list

  @TC-006 @Medium
  Scenario: Deleting the last remaining program shows the empty state
    Given I am logged in as admin
    And I am on the Programs page
    And only one program "Last Program To Delete" is visible for this test context
    When I click the delete icon for "Last Program To Delete"
    And I confirm deletion
    Then "Last Program To Delete" is removed from the program list
    And the empty-state messaging is shown when no programs remain

  @TC-007 @Medium
  Scenario: Confirmation dialog identifies the program being deleted
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Named Confirm Program" exists
    When I click the delete icon for "Named Confirm Program"
    Then I see a confirmation dialog
    And the confirmation dialog references "Named Confirm Program" or clearly asks to confirm deletion

  # Ambiguities and gaps
  # - Exact confirmation dialog title, body copy, and button labels (Confirm/Delete/Cancel) are not specified in the ticket
  # - Whether delete uses an icon-only control vs a labeled "Delete …" button is implied by "delete icon" but UI may expose accessible names
  # - Success feedback after delete (toast vs silent list refresh) is unspecified
  # - Behavior when DELETE API fails (dialog remains? error message?) is not covered in ACs
  # - Concurrent delete / double-confirm and permission/auth for delete are not specified
