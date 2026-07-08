Feature: Create new academic program
  DS-1 — Admin creates a new academic program from the Programs page

  # Happy paths

  @TC-001 @High @AC-NavigateToForm
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

  @TC-002 @High @AC-SuccessfulCreate
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

  @TC-003 @Medium
  Scenario: Program is created with name only and empty description
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with "Data Science Fundamentals"
    And I leave "Description" empty
    And I click "Create"
    Then the modal closes
    And the program list shows "Data Science Fundamentals"
    And no description paragraph is shown under the program name in the list

  @TC-004 @High @AC-EmptyNameValidation
  Scenario: Create button is disabled when Program Name is empty
    Given I am logged in as admin
    And I am on the program creation form
    When I leave "Program Name" empty
    And I optionally fill in "Description" with any text
    Then the "Create" button is disabled
    And no program is created
    And the modal remains open

  @TC-005 @High @AC-EmptyNameValidation
  Scenario: Create button becomes enabled after entering a valid Program Name
    Given I am logged in as admin
    And I am on the program creation form
    And "Program Name" is empty
    And the "Create" button is disabled
    When I fill in "Program Name" with "Cybersecurity Basics"
    Then the "Create" button becomes enabled
    And I can submit the form

  @TC-006 @Medium @AC-SuccessfulCreate
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

  @TC-024 @Medium
  Scenario: Programs page displays program list with management actions
    Given I am logged in as admin
    When I navigate to the Programs page
    Then I see the heading "Programs"
    And I see the subtitle "Manage academic programs and semesters"
    And I see a program table with a "Program" column header
    And each program row has "Edit" and "Delete" action buttons
    And I see the hint "Select a program to manage semesters"

  @TC-025 @Low
  Scenario: Program creation form includes optional AI Generation Config fields
    Given I am logged in as admin
    And I am on the program creation form
    Then I see a "Show AI Generation Config" section toggle
    And I see optional fields for Total Program Hours, Default Session Hours, Default Exam Hours, Target Audience, Focus Areas, and Sync/Async Ratio
    And I can create a program by filling only "Program Name" without completing AI config fields

  # Negative

  @TC-007 @High
  Scenario: Whitespace-only Program Name does not create a program
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with "   "
    And I fill in "Description" with "Valid description text"
    Then the "Create" button remains disabled
    And no program is created
    And the modal remains open
    And the program list is unchanged

  @TC-008 @Medium
  Scenario: Canceling the form does not create a program
    Given I am logged in as admin
    And I am on the program creation form
    And I note the current program list contents
    When I fill in "Program Name" with "Temporary Program Name"
    And I fill in "Description" with "Temporary description"
    And I click "Cancel"
    Then the modal closes
    And no new program is added to the program list
    And the previously entered values are not persisted

  @TC-009 @High
  Scenario: Non-admin user cannot access program creation
    Given I am logged in as a non-admin user
    And I am on the Programs page if it is accessible to my role
    When I look for the "+ New Program" control
    And I attempt to open the program creation form if the control is visible
    Then the "+ New Program" control is hidden or disabled
    And no program can be created by a non-admin user

  @TC-010 @High
  Scenario: Unauthenticated user cannot open program creation form
    Given I am not logged in
    When I navigate directly to the Programs page
    Then I am redirected to the login page
    And the program creation form is not accessible
    And the "+ New Program" button is not visible
    And no program is created

  @TC-011 @High
  Scenario: Duplicate Program Name is rejected with an error
    Given I am logged in as admin
    And the program "Web Development 2026" already exists in the program list
    And I am on the program creation form
    When I fill in "Program Name" with "Web Development 2026"
    And I fill in "Description" with "Another description for duplicate name"
    And I click "Create"
    Then creation is blocked with a clear duplicate-name error
    And exactly one program with that name remains in the list
    And no second row is created

  @TC-012 @Medium
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

  @TC-013 @Medium
  Scenario: Double-clicking Create creates exactly one program
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with "UI/UX Design 2026"
    And I fill in "Description" with "Design thinking and prototyping"
    And I rapidly double-click "Create"
    Then exactly one program "UI/UX Design 2026" is created
    And the modal closes once
    And no duplicate rows appear in the program list

  @TC-026 @Medium
  Scenario: Closing the form via the header X button does not create a program
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with "X Close Test Program"
    And I click the header close ("X") button
    Then the modal closes
    And "X Close Test Program" does not appear in the program list

  # Edge cases

  @TC-014 @Medium
  Scenario: Program Name at minimum valid length is handled correctly
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with "A"
    And I fill in "Description" with "Single-letter name boundary test"
    And I click "Create"
    Then if a 1-character name is allowed, the program "A" is created and listed
    And if minimum length is greater than 1, a validation error is shown and submission is blocked

  @TC-015 @Medium
  Scenario: Program Name at maximum allowed length (100 characters) is accepted
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with a 100-character string
    And I fill in "Description" with "Max length boundary test"
    And I click "Create"
    Then the program is created with the full name displayed correctly in the list
    And no server or client error occurs

  @TC-016 @Medium
  Scenario: Program Name exceeding 100 characters is rejected
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with a 101-character string
    And I fill in "Description" with "Over-limit name test"
    And I click "Create"
    Then the modal remains open or a validation error is shown
    And no program is created
    And the user receives clear feedback about the length limit

  @TC-017 @Medium
  Scenario: Special characters in Program Name are handled correctly
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with "Web Dev & Design — 2026 (Cohort #1)"
    And I fill in "Description" with "Special characters test"
    And I click "Create"
    Then the program is created with the exact name preserved
    And the name displays correctly in the program list
    And no HTML injection, broken encoding, or unexpected character stripping occurs

  @TC-018 @Low
  Scenario: Unicode and international characters are preserved in Program Name and Description
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with "プログラミング基礎 2026"
    And I fill in "Description" with "Curso de desarrollo web — año 2026"
    And I click "Create"
    Then the program is created with Unicode characters preserved
    And the program list displays the characters correctly in both name and description

  @TC-019 @Medium
  Scenario: Leading and trailing spaces in Program Name are trimmed on save
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with "  Web Development 2026  "
    And I fill in "Description" with "Trim behavior test"
    And I click "Create"
    Then the program is saved with name "Web Development 2026"
    And the program list shows "Web Development 2026" without leading or trailing spaces
    And no duplicate-looking entries appear due to invisible whitespace

  @TC-020 @Low
  Scenario: Description at maximum length (500 characters) is accepted
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with "AI Engineering 2026"
    And I fill in "Description" with a 500-character string
    And I click "Create"
    Then the program is created successfully

  @TC-027 @Medium
  Scenario: Description exceeding 500 characters is rejected
    Given I am logged in as admin
    And I am on the program creation form
    When I fill in "Program Name" with "Long Description Reject Test"
    And I fill in "Description" with a 501-character string
    And I click "Create"
    Then the modal remains open or a validation error is shown
    And no program is created
    And the user receives clear feedback about the length limit

  @TC-021 @Medium
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

  @TC-022 @Low
  Scenario: Reopening the form after successful create shows empty fields
    Given I am logged in as admin
    And I have just created a program successfully via the program creation form
    When I click "+ New Program" again
    Then the "Program Name" field is empty
    And the "Description" field is empty
    And the previous submission values are not pre-filled

  @TC-023 @Low
  Scenario: Program creation form can be submitted via keyboard
    Given I am logged in as admin
    And I am on the program creation form
    When I tab to "Program Name" and enter "Accessible Program 2026"
    And I tab to "Description" and enter "Keyboard navigation test"
    And I tab to "Create" and press Enter or Space
    Then the program "Accessible Program 2026" is created successfully
    And focus management after close is logical

  # Ambiguities and gaps
  # - Non-admin access (TC-009): only admin credentials available; non-admin behavior not verified
  # - Single-character name (TC-014): minimum length rule not documented in ticket or Confluence
  # - API failure UX (TC-012): error message content and modal state on failure not specified
  # - AI config toggle: collapse/expand behavior for "Show AI Generation Config" unclear
  # - Success feedback: no toast/confirmation beyond modal close and list update observed
  # - Known bugs on test.didaxis.studio: duplicate names accepted, names >100 chars accepted,
  #   descriptions >500 chars accepted, double-click creates two programs
