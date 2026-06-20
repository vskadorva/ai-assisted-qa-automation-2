# DS-1: Ticket Input — Create New Academic Program

## Feature

**Create new academic program**

## Role

Senior QA engineer reviewing the feature described below.

## Task

Create a detailed test plan for the "Create new academic program" feature.

## Acceptance Criteria

### Scenario: Navigate to program creation form

- **Given** I am logged in as admin
- **When** I navigate to the Programs page
- **And** I click "+ New Program"
- **Then** I see the program creation form with fields: Program Name, Description

### Scenario: Successfully create a program

- **Given** I am on the program creation form
- **When** I fill in Program Name with "Web Development 2026"
- **And** I fill in Description with "Full-stack web development program"
- **And** I click Create
- **Then** the modal closes
- **And** the program list shows "Web Development 2026"

### Scenario: Validation prevents empty program name

- **Given** I am on the program creation form
- **When** I leave the Program Name field empty
- **Then** the Create button is disabled

## Requirements for Test Cases

- Cover every AC with at least one test case
- Add edge cases the ACs don't mention:
  - Boundary values
  - Empty inputs
  - Special characters
  - Duplicates
  - Max-length
- Add negative test cases (what should NOT happen)
- Structure each test case as:
  - **ID** (TC-001, TC-002, etc.)
  - **Title** (expected behavior, not action)
  - **Preconditions**
  - **Steps** (numbered)
  - **Expected result**
  - **Priority** (High / Medium / Low)
- Group by:
  - Positive flows
  - Negative flows
  - Edge cases

## Output Format

- Structured test plan in Markdown
- Use real field names and values, not placeholders
- At the end: list any ambiguities or gaps in the ACs

## UI Elements Reference

| Element        | Label / Value                          |
|----------------|----------------------------------------|
| Page           | Programs page                          |
| Action button  | + New Program                          |
| Field 1        | Program Name                           |
| Field 2        | Description                            |
| Submit button  | Create                                 |
| Sample name    | Web Development 2026                   |
| Sample desc    | Full-stack web development program     |
| User role      | Admin                                  |
