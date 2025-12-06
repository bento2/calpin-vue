// E2E test for the homepage navigation and main features
describe('Homepage Navigation', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should load the homepage successfully', () => {
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('should display navigation menu', () => {
    // Check for bottom navigation
    cy.get('.v-bottom-navigation').should('exist')
  })

  it('should navigate to Exercices page from menu', () => {
    // Click on exercices button in bottom nav
    cy.contains('Exercices').click()
    cy.url().should('include', '/exercices')
  })

  it('should navigate to Trainings page from menu', () => {
    // Click on trainings button
    cy.contains('Entraînements').click()
    cy.url().should('include', '/trainings')
  })

  it('should navigate to History page from menu', () => {
    cy.contains('Historiques').click()
    cy.url().should('include', '/history')
  })

  it('should display homepage content', () => {
    // Check that the main content area exists
    cy.get('.v-main').should('exist')
    // Check for bottom navigation with buttons
    cy.get('.v-bottom-navigation .v-btn').should('have.length.greaterThan', 0)
  })
})
