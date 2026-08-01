Feature: Dashboard displaying the right components
  DS-119 — Admin sees the correct dashboard blocks and can navigate to key pages

  # Happy paths

  @TC-001 @High @AC-NavigateToDashboard
  Scenario: Navigate to the Dashboard
    Given I am logged in as admin
    When I navigate to the Dashboard page
    Then I see the Dashboard with the right blocks: Programs, Calendar, Validation, AI Assist
    And I see the heading "Dashboard"
    And I see the welcome message "Welcome to Didaxis Studio"

  @TC-002 @High @AC-NavigateToPrograms
  Scenario: Successfully navigate to Program Page
    Given I am on the Dashboard
    When I click on the Programs card
    Then I navigate to the Programs page
    And I see the heading "Programs"

  @TC-003 @High @AC-NavigateToCalendar
  Scenario: Successfully navigate to Calendar Page
    Given I am on the Dashboard
    When I click on the Calendar card
    Then I navigate to the Calendar page
    And I see the heading "Calendar"

  @TC-004 @High @AC-NavigateToValidation
  Scenario: Successfully navigate to Validation Page
    Given I am on the Dashboard
    When I click on the Validation card
    Then I navigate to the Validation page
    And I see the heading "Validation"

  @TC-005 @High @AC-NavigateToAIAssist
  Scenario: Successfully navigate to AI Assist Page
    Given I am on the Dashboard
    When I click on the AI Assist card
    Then I navigate to the AI Assist page
    And I see the heading "AI Assist"

  @TC-006 @Medium
  Scenario: Dashboard shows descriptive subtitles for each block
    Given I am logged in as admin
    And I am on the Dashboard
    Then I see "Manage academic programs" under the Programs block
    And I see "Schedule & drag-drop" under the Calendar block
    And I see "Check for conflicts" under the Validation block
    And I see "AI-powered editing" under the AI Assist block

  @TC-007 @Medium
  Scenario: Dashboard shows Quick Start guidance
    Given I am logged in as admin
    And I am on the Dashboard
    Then I see a "Quick Start" section
    And the Quick Start lists steps for Program, Calendar, Validation, and AI Assist

  # Negative

  @TC-008 @High
  Scenario: Unauthenticated user cannot access the Dashboard
    Given I am not logged in
    When I navigate directly to the Dashboard page
    Then I am redirected to the login page
    And the dashboard blocks are not visible

  @TC-009 @Medium
  Scenario: Sidebar navigation remains available from the Dashboard
    Given I am logged in as admin
    And I am on the Dashboard
    Then I see sidebar navigation for Dashboard, Programs, Calendar, and Validation
    And I see a "Sign out" control

  # Edge cases

  @TC-010 @Medium
  Scenario: Direct navigation to /dashboard does not show dashboard blocks
    Given I am logged in as admin
    When I navigate directly to "/dashboard"
    Then the main content area does not show the Dashboard heading or feature blocks
    And I can reach the Dashboard via the sidebar "Dashboard" control

  @TC-011 @Low
  Scenario: Dashboard shows connected status and program count
    Given I am logged in as admin
    And I am on the Dashboard
    Then I see a connected status indicator
    And I see a numeric program count display

  # Ambiguities and gaps
  # - Ticket says "Dashboard page" but home route is "/" — "/dashboard" renders empty main content (TC-010)
  # - Ticket typo "Dashboardx" in AC — interpreted as "Dashboard"
  # - AI Assist navigates to "/cli" not "/ai-assist" — heading still "AI Assist"
  # - Card action labels (View, Check, Open) are visual only; entire card is clickable
  # - Confluence reference "Program Setup & Management > Overview" not fetched; AC embedded in ticket used as source
