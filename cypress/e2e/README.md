# E2E Tests Documentation

## Overview

This directory contains end-to-end (E2E) tests for the Calpin Vue application using Cypress. These tests verify the complete user workflows and interactions across the application.

## Test Files

**Tests:**

- Application loads successfully
- Navigation is present and functional

### Homepage Navigation

Tests for the homepage and main navigation functionality.

**Tests:**

- Homepage loads successfully
- Navigation menu is displayed
- Navigation to Exercices, Trainings, and History pages
- Welcome content is visible

### Exercices Page

Tests for the exercices listing and search functionality.

**Tests:**

- Exercices page loads
- Exercice list displays correctly
- Search field is present
- Search filtering works
- Clear search functionality
- Exercice details are displayed
- Infinite scroll for loading more exercices

### Trainings Flow

Tests for trainings list, creation, and viewing functionality.

**Tests:**

- Trainings page loads
- Trainings list or empty state displays
- Create new training button exists
- Create training dialog opens
- View training details
- Training detail page displays information
- Start session from training

### Session Flow

Tests for active training session functionality.

**Tests:**

- Session page handles valid/invalid IDs
- Session progress UI displays
- Exercices shown in session
- Series data entry
- Navigation controls (next/previous)
- Session completion

### History Page

Tests for viewing past training sessions.

**Tests:**

- History page loads
- Session history list or empty state
- Session information display
- Filtering and sorting options
- Session detail view
- Statistics display
- Delete session functionality

### Complete User Journey

End-to-end tests simulating complete user workflows.

**Tests:**

- Complete training workflow (create → start → complete → view history)
- Navigation through all main pages
- Responsive design on mobile, tablet, and desktop
- Error handling for non-existent resources
- Invalid route handling

## Running the Tests

### Development Mode (Interactive)

```bash
npm run test:e2e:dev
```

This opens the Cypress Test Runner in interactive mode, allowing you to see tests run in real-time.

### Production Mode (Headless)

```bash
npm run test:e2e
```

This builds the application and runs all tests in headless mode.

## Test Structure

Each test file follows this structure:

```typescript
describe('Test Suite Name', () => {
  beforeEach(() => {
    // Setup before each test
    cy.visit('/page')
  })

  it('should do something', () => {
    // Test assertions
    cy.get('element').should('exist')
  })
})
```

## Best Practices

1. **Use data-testid attributes**: Where possible, use `data-testid` attributes for more reliable selectors
2. **Handle asynchronous operations**: Use Cypress's built-in retry logic instead of arbitrary waits
3. **Test user workflows**: Focus on what users actually do, not implementation details
4. **Handle empty states**: Tests gracefully handle cases where data might not exist
5. **Responsive design**: Tests verify the application works on different screen sizes

## Conditional Testing

Many tests include conditional logic to handle cases where data might not exist:

```typescript
cy.get('body').then(($body) => {
  if ($body.find('[data-testid="item"]').length > 0) {
    // Test when items exist
  } else {
    // Test empty state
  }
})
```

This makes tests more robust and prevents failures due to empty states.

## Adding New Tests

When adding new E2E tests:

1. Create a new `.cy.ts` file in `cypress/e2e/`
2. Import necessary Cypress commands
3. Use descriptive test names
4. Group related tests in `describe` blocks
5. Use `beforeEach` for common setup
6. Add appropriate assertions
7. Document the test in this README

## Troubleshooting

### Tests failing due to timing issues

- Increase timeout in specific assertions: `cy.get('element', { timeout: 10000 })`
- Use Cypress's built-in waiting: `cy.wait('@apiCall')`

### Tests failing due to missing elements

- Check if element selectors are correct
- Verify the element is actually rendered in the application
- Use Cypress's debugging: `cy.debug()` or `cy.pause()`

### Tests failing intermittently

- Avoid arbitrary `cy.wait()` calls
- Use proper assertions that wait for conditions
- Check for race conditions in the application

## Coverage

The E2E tests cover:

- ✅ Homepage and navigation
- ✅ Exercices listing and search
- ✅ Training management
- ✅ Active session flow
- ✅ Session history
- ✅ Complete user workflows
- ✅ Responsive design
- ✅ Error handling

## Next Steps

Consider adding:

- Tests for authentication flows (if implemented)
- Tests for offline functionality (PWA features)
- Tests for data persistence
- Performance testing
- Accessibility testing
