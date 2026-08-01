Feature: Program name validation and duplicate prevention
  DS-3 — Admin cannot submit invalid or duplicate program names on create

  # Happy paths

  @TC-001 @High @AC-SpecialCharacters
  Scenario: Accept program name with special characters
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with "Informatique & IA - Niveau 2"
    And I fill in "Description" with "Advanced informatics and AI track"
    And I click "Create"
    Then the modal closes
    And the program list shows "Informatique & IA - Niveau 2"
    And the description "Advanced informatics and AI track" appears under the program name in the list

  @TC-002 @Medium
  Scenario: Leading and trailing spaces are trimmed before validation and save
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with "  Web Development 2026  "
    And I fill in "Description" with "Trim behavior on create"
    And I click "Create"
    Then the modal closes
    And the program list shows "Web Development 2026"
    And no duplicate row with leading or trailing spaces appears in the list

  # Negative

  @TC-003 @High @AC-WhitespaceOnly
  Scenario: Reject program name with only whitespace
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with "   "
    And I fill in "Description" with "Valid description text"
    And I click "Create"
    Then the form is not submitted
    And the "Create" button is disabled or save is blocked with validation
    And the modal remains open
    And no program is created

  @TC-004 @High @AC-DuplicateName
  Scenario: Reject duplicate program name
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Web Development 2026" already exists
    And I am on the program creation form
    When I fill in "Program Name" with "Web Development 2026"
    And I fill in "Description" with "Another description for duplicate name"
    And I click "Create"
    Then I see an error indicating the name already exists
    And the modal remains open or reopens with the entered data preserved
    And exactly one program named "Web Development 2026" appears in the list

  @TC-005 @High
  Scenario: Empty Program Name does not create a program
    Given I am logged in as admin
    And I am on the program creation form
    When I leave "Program Name" empty
    And I fill in "Description" with "Optional description text"
    Then the "Create" button is disabled
    And no program is created
    And the modal remains open

  @TC-006 @Medium
  Scenario: Duplicate check is case-sensitive or case-insensitive per product rules
    Given I am logged in as admin
    And a program "Web Development 2026" already exists
    And I am on the program creation form
    When I fill in "Program Name" with "web development 2026"
    And I fill in "Description" with "Case variant duplicate test"
    And I click "Create"
    Then duplicate-name validation behavior is consistent with product rules
    And at most one canonical program name appears in the list

  # Edge cases

  @TC-007 @Medium
  Scenario: Duplicate name after trimming whitespace is rejected
    Given I am logged in as admin
    And a program "Web Development 2026" already exists
    And I am on the program creation form
    When I fill in "Program Name" with "  Web Development 2026  "
    And I fill in "Description" with "Padded duplicate name test"
    And I click "Create"
    Then duplicate-name validation blocks the create
    And exactly one program named "Web Development 2026" appears in the list

  @TC-008 @Medium
  Scenario: Program Name at maximum allowed length (100 characters) is accepted
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with a 100-character string
    And I fill in "Description" with "Max length boundary test"
    And I click "Create"
    Then the modal closes
    And the program list shows the full 100-character name correctly

  @TC-009 @Medium
  Scenario: Program Name exceeding 100 characters is rejected
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with a 101-character string
    And I fill in "Description" with "Over-limit name test"
    And I click "Create"
    Then the modal remains open or a validation error is shown
    And no program is created
    And the user receives clear feedback about the length limit

  @TC-010 @Low
  Scenario: Unicode characters in Program Name are accepted
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with "プログラミング基礎 2026"
    And I fill in "Description" with "Unicode name validation test"
    And I click "Create"
    Then the modal closes
    And the program list displays the Unicode name correctly

  # Ambiguities and gaps
  # - Duplicate error message text is not specified in DS-3 AC (toast vs inline vs modal)
  # - Case sensitivity for duplicate names is not documented (TC-006)
  # - Whether duplicate check applies after trim only or also normalizes internal whitespace (TC-007)
  # - Max length (100 chars) inferred from DS-1 validation rules, not stated in DS-3 AC
  # - Known product bug on test.didaxis.studio: duplicate names may be accepted (see DS-1 TC-011 fixme)
