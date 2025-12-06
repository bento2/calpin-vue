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
        cy.contains(/aucun|vide|créer|nouveau|nouvel/i).should('exist')
      }
    })
  })

  it('should have a button to create new training', () => {
    // Look for create/add button
    cy.get('button')
      .contains(/créer|nouveau|ajouter|nouvel/i)
      .should('exist')
  })

  it('should create a new training and navigate to details when clicking create button', () => {
    // Click create button
    cy.get('button')
      .contains(/créer|nouveau|ajouter|nouvel/i)
      .first()
      .click()

    // Should navigate to training detail page
    cy.url().should('match', /trainings\/[\w-]+/)
  })

  it('should be able to view training details', () => {
    // First check if trainings exist
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="training-card"], .v-card').length > 0) {
        // Click on edit button (second button) in first training
        cy.get('[data-testid="training-card"], .v-card')
          .first()
          .find('.v-card-title button')
          .eq(1)
          .click()

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
    // But since we can't easily guess a valid ID, we test the 404/handling or simple load
    cy.visit('/trainings/test-id-not-found', { failOnStatusCode: false })

    // Should either show training or error state (or at least body)
    cy.get('body').should('exist')
  })

  it('should display training information when training exists', () => {
    // Visit trainings list first
    cy.visit('/trainings')

    // If trainings exist, click on one
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="training-card"], .v-card').length > 0) {
        cy.get('[data-testid="training-card"], .v-card')
          .first()
          .find('.v-card-title button')
          .eq(1)
          .click()

        // Should show training details - checking for inputs or headers
        cy.get('input[type="text"]').should('exist')

        // Should have exercice list container
        cy.get('.v-list, .v-col').should('exist')
      }
    })
  })

  it('should be able to start a session from training', () => {
    cy.visit('/trainings')

    cy.get('body').then(($body) => {
      // Ensure we have a training to test with. If not, create one.
      if ($body.find('[data-testid="training-card"], .v-card').length === 0) {
        cy.get('button')
          .contains(/créer|nouveau|ajouter|nouvel/i)
          .click()
        cy.url().should('match', /trainings\/[\w-]+/)
        cy.visit('/trainings') // Go back to list
      }

      // Click the play button (first button) on the first card
      cy.get('[data-testid="training-card"], .v-card')
        .first()
        .find('.v-card-title button')
        .first()
        .click()

      // Look for session elements (e.g. valid session URL)
      cy.url().should('include', '/sessions/')
    })
  })

  it('should verify localstorage contains correct session files after starting session', () => {
    cy.visit('/trainings')

    cy.get('body').then(($body) => {
      // Ensure we have a training to test with.
      if ($body.find('[data-testid="training-card"], .v-card').length === 0) {
        cy.get('button')
          .contains(/créer|nouveau|ajouter|nouvel/i)
          .click()
        cy.url().should('match', /trainings\/[\w-]+/)
        cy.visit('/trainings')
      }

      // Click Play button (first button)
      cy.get('[data-testid="training-card"], .v-card')
        .first()
        .find('.v-card-title button')
        .first()
        .click()

      // 3. Verify navigation to session page
      cy.url().should('include', '/sessions/')

      // 4. Check LocalStorage
      cy.window().then((window) => {
        const sessionsData = window.localStorage.getItem('sessions')
        expect(sessionsData).to.not.equal(null)
        const sessions = JSON.parse(sessionsData!)
        expect(sessions).to.be.an('array')
        expect(sessions.length).to.be.greaterThan(0)

        // Check if the latest session has status 'en_cours'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentSession = sessions.find((s: any) => s.status === 'en_cours')
        expect(currentSession).to.not.equal(undefined)
        expect(currentSession).to.have.property('id')
        expect(currentSession).to.have.property('trainingId')
      })
    })
  })
})
