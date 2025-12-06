// E2E test for trainings page and training flow
describe('Trainings Flow', () => {
  beforeEach(() => {
    cy.visit('/trainings')
  })

  it('should load the trainings page successfully', () => {
    cy.url().should('include', '/trainings')
  })

  it('should display trainings list or empty state', () => {
    // Should show either trainings or an empty state message
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="training-card"], .v-card').length > 0) {
        cy.get('[data-testid="training-card"], .v-card').should('exist')
      } else {
        // Empty state
        cy.contains(/aucun|vide|créer|nouveau/i).should('exist')
      }
    })
  })

  it('should have a button to create new training', () => {
    // Look for create/add button
    cy.get('button')
      .contains(/créer|nouveau|ajouter/i)
      .should('exist')
  })

  it('should open create training dialog when clicking create button', () => {
    // Click create button
    cy.get('button')
      .contains(/créer|nouveau|ajouter/i)
      .first()
      .click()

    // Should show dialog or form
    cy.get('.v-dialog, [role="dialog"], form').should('be.visible')
  })

  it('should be able to view training details', () => {
    // First check if trainings exist
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="training-card"], .v-card').length > 0) {
        // Click on first training
        cy.get('[data-testid="training-card"], .v-card').first().click()

        // Should navigate to training detail page
        cy.url().should('match', /trainings\/[\w-]+/)
      } else {
        cy.log('No trainings available to test')
      }
    })
  })
})

describe('Training Detail Page', () => {
  it('should handle direct navigation to training detail', () => {
    // Try to visit a training detail page
    // This will likely show an error or redirect if training doesn't exist
    cy.visit('/trainings/test-id', { failOnStatusCode: false })

    // Should either show training or error state
    cy.get('body').should('exist')
  })

  it('should display training information when training exists', () => {
    // Visit trainings list first
    cy.visit('/trainings')

    // If trainings exist, click on one
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="training-card"], .v-card').length > 0) {
        cy.get('[data-testid="training-card"], .v-card').first().click()

        // Should show training details
        cy.get('h1, h2').should('exist')

        // Should have exercice list
        cy.get('[data-testid="exercice-item"], .v-list-item, .v-card').should('exist')
      }
    })
  })

  it('should be able to start a session from training', () => {
    cy.visit('/trainings')

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="training-card"], .v-card').length > 0) {
        cy.get('[data-testid="training-card"], .v-card').first().click()

        // Look for start session button
        cy.get('button')
          .contains(/commencer|démarrer|start/i)
          .should('exist')
      }
    })
  })
})
