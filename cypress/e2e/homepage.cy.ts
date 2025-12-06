// E2E test for the homepage navigation and main features
describe('Homepage Navigation', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should load the homepage successfully', () => {
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('should display navigation menu', () => {
    // Check for navigation drawer or menu button
    cy.get('nav').should('exist')
  })

  it('should navigate to Exercices page from menu', () => {
    // Click on exercices link/button
    cy.contains('Exercices').click()
    cy.url().should('include', '/exercices')
  })

  it('should navigate to Trainings page from menu', () => {
    cy.contains('Entrainements').click()
    cy.url().should('include', '/trainings')
  })

  it('should navigate to History page from menu', () => {
    cy.contains('Historiques').click()
    cy.url().should('include', '/history')
  })

  it('should display welcome content on homepage', () => {
    // Check for main content elements
    cy.get('h1, h2, h3').should('exist')
  })
})
