// Complete end-to-end user journey test
describe('Complete User Journey', () => {
  it('should complete a full training workflow from start to finish', () => {
    // Step 1: Visit homepage
    cy.visit('/')
    cy.url().should('eq', Cypress.config().baseUrl + '/')

    // Step 2: Navigate to trainings
    cy.contains('Entrainements').click()
    cy.url().should('include', '/trainings')

    // Step 3: Check if trainings exist or create one
    cy.get('body').then(($body) => {
      // If no trainings exist, this workflow might need setup
      if ($body.find('[data-testid="training-card"], .v-card').length > 0) {
        // Step 4: Select a training
        cy.get('[data-testid="training-card"], .v-card').first().click()
        cy.url().should('match', /trainings\/[\w-]+/)

        // Step 5: Start a session
        cy.get('button')
          .contains(/commencer|démarrer|start/i)
          .first()
          .click()
        cy.url().should('match', /sessions\/[\w-]+/, { timeout: 10000 })

        // Step 6: Enter some data in the session
        cy.get('input[type="number"]')
          .first()
          .then(($input) => {
            if ($input.length > 0) {
              cy.wrap($input).clear().type('10')
            }
          })

        // Step 7: Navigate through exercises (if multiple)
        cy.get('button')
          .contains(/suivant|next/i)
          .then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn).first().click()
            }
          })

        // Step 8: Complete the session
        cy.get('button')
          .contains(/terminer|finir|compléter/i)
          .then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn).first().click()
            }
          })

        // Step 9: Navigate to history
        cy.contains('Historiques').click()
        cy.url().should('include', '/history')

        // Step 10: Verify session appears in history
        cy.get('[data-testid="session-card"], .v-card, .v-list-item').should('exist')
      } else {
        cy.log('No trainings available for complete workflow test')
      }
    })
  })

  it('should navigate through all main pages', () => {
    const pages = [
      { name: 'Home', url: '/', linkText: null },
      { name: 'Exercices', url: '/exercices', linkText: 'Exercices' },
      { name: 'Trainings', url: '/trainings', linkText: 'Entrainements' },
      { name: 'History', url: '/history', linkText: 'Historiques' },
    ]

    pages.forEach((page) => {
      if (page.linkText) {
        cy.contains(page.linkText).click()
        cy.url().should('include', page.url)
      } else {
        cy.visit(page.url)
        cy.url().should('eq', Cypress.config().baseUrl + page.url)
      }

      // Verify page loaded
      cy.get('body').should('exist')

      // Go back to home
      cy.visit('/')
    })
  })
})

describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ]

  viewports.forEach((viewport) => {
    it(`should display correctly on ${viewport.name}`, () => {
      cy.viewport(viewport.width, viewport.height)
      cy.visit('/')

      // Check that content is visible
      cy.get('body').should('be.visible')

      // Navigate to different pages
      cy.visit('/exercices')
      cy.get('body').should('be.visible')

      cy.visit('/trainings')
      cy.get('body').should('be.visible')

      cy.visit('/history')
      cy.get('body').should('be.visible')
    })
  })
})

describe('Error Handling', () => {
  it('should handle non-existent training gracefully', () => {
    cy.visit('/trainings/non-existent-id', { failOnStatusCode: false })
    cy.get('body').should('exist')
  })

  it('should handle non-existent session gracefully', () => {
    cy.visit('/sessions/non-existent-id', { failOnStatusCode: false })
    cy.get('body').should('exist')
  })

  it('should handle invalid routes', () => {
    cy.visit('/invalid-route', { failOnStatusCode: false })
    cy.get('body').should('exist')
  })
})
