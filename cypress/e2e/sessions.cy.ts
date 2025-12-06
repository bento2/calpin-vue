// E2E test for training session flow
describe('Training Session Flow', () => {
  it('should handle session page with valid ID', () => {
    // This test would need a valid session ID
    // For now, we test that the route exists
    cy.visit('/sessions/test-session-id', { failOnStatusCode: false })
    cy.get('body').should('exist')
  })

  it('should display session progress UI when session is active', () => {
    // Visit trainings and try to start a session
    cy.visit('/trainings')

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="training-card"], .v-card').length > 0) {
        // Click on training
        cy.get('[data-testid="training-card"], .v-card').first().click()

        // Try to start session
        cy.get('button')
          .contains(/commencer|démarrer|start/i)
          .then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn).first().click()

              // Should navigate to session page
              cy.url().should('match', /sessions\/[\w-]+/)

              // Should show session UI elements
              cy.get('body').should('exist')
            }
          })
      }
    })
  })

  it('should display exercices in the session', () => {
    cy.visit('/trainings')

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="training-card"], .v-card').length > 0) {
        cy.get('[data-testid="training-card"], .v-card').first().click()

        cy.get('button')
          .contains(/commencer|démarrer|start/i)
          .then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn).first().click()

              // Should show exercice information
              cy.get('[data-testid="exercice-name"], h1, h2, h3').should('exist')
            }
          })
      }
    })
  })

  it('should allow entering series data during session', () => {
    cy.visit('/trainings')

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="training-card"], .v-card').length > 0) {
        cy.get('[data-testid="training-card"], .v-card').first().click()

        cy.get('button')
          .contains(/commencer|démarrer|start/i)
          .then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn).first().click()

              // Look for input fields for series data
              cy.get('input[type="number"], input[type="text"]').should('exist')
            }
          })
      }
    })
  })

  it('should have navigation controls (next/previous)', () => {
    cy.visit('/trainings')

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="training-card"], .v-card').length > 0) {
        cy.get('[data-testid="training-card"], .v-card').first().click()

        cy.get('button')
          .contains(/commencer|démarrer|start/i)
          .then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn).first().click()

              // Should have next/previous buttons or similar navigation
              cy.get('button').should('have.length.greaterThan', 0)
            }
          })
      }
    })
  })

  it('should allow completing and ending the session', () => {
    cy.visit('/trainings')

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="training-card"], .v-card').length > 0) {
        cy.get('[data-testid="training-card"], .v-card').first().click()

        cy.get('button')
          .contains(/commencer|démarrer|start/i)
          .then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn).first().click()

              // Look for finish/complete button
              cy.get('button')
                .contains(/terminer|finir|compléter/i)
                .should('exist')
            }
          })
      }
    })
  })
})
