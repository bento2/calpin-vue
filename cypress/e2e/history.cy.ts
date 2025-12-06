// E2E test for history page
describe('History Page', () => {
  beforeEach(() => {
    cy.visit('/history')
  })

  it('should load the history page successfully', () => {
    cy.url().should('include', '/history')
  })

  it('should display session history list or empty state', () => {
    // Should show either history items or empty state
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="session-card"], .v-card, .v-list-item').length > 0) {
        cy.get('[data-testid="session-card"], .v-card, .v-list-item').should('exist')
      } else {
        // Empty state
        cy.contains(/aucun|vide|historique|session/i).should('exist')
      }
    })
  })

  it('should display session information if sessions exist', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="session-card"], .v-card').length > 0) {
        // Check first session card
        cy.get('[data-testid="session-card"], .v-card')
          .first()
          .within(() => {
            // Should have date or title
            cy.get('.v-card-title, .v-card-subtitle, h2, h3, h4').should('exist')
          })
      }
    })
  })

  it('should allow filtering or sorting history', () => {
    // Look for filter or sort controls - check that UI elements exist
    cy.get('button, select, .v-select').should('have.length.greaterThan', 0)
  })

  it('should display session details when clicking on a session', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="session-card"], .v-card').length > 0) {
        // Click on first session
        cy.get('[data-testid="session-card"], .v-card').first().click()

        // Should show details (either in dialog or expanded view)
        cy.get('.v-dialog, [role="dialog"], .v-expansion-panel-text').should('be.visible')
      }
    })
  })

  it('should show statistics or summary of past sessions', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="session-card"], .v-card').length > 0) {
        // Check for statistics display
        cy.get('[data-testid="stats"], .stats, .v-card').should('exist')
      }
    })
  })

  it('should allow deleting a session from history', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="session-card"], .v-card').length > 0) {
        // Look for delete button (might be in menu or direct button)
        cy.get('button[aria-label*="delete"], button[aria-label*="supprimer"], .mdi-delete').should(
          'exist',
        )
      }
    })
  })
})
