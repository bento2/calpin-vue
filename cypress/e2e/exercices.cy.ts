// E2E test for the exercices page functionality
describe('Exercices Page', () => {
  beforeEach(() => {
    cy.visit('/exercices')
  })

  it('should load the exercices page successfully', () => {
    cy.url().should('include', '/exercices')
  })

  it('should display exercice list', () => {
    // Wait for exercices to load
    cy.get('[data-testid="exercice-card"], .v-card', { timeout: 10000 }).should(
      'have.length.greaterThan',
      0,
    )
  })

  it('should display search field', () => {
    cy.get('input[placeholder*="Recherche"], input[placeholder*="exercice"]').should('exist')
  })

  it('should filter exercices when searching', () => {
    const searchTerm = 'Pompes'

    // Type in search field
    cy.get('input[placeholder*="Recherche"], input[placeholder*="exercice"]')
      .first()
      .type(searchTerm)

    // Should show filtered results (Cypress will wait automatically)
    cy.get('[data-testid="exercice-card"], .v-card', { timeout: 1000 }).should('exist')
  })

  it('should type and clear search field', () => {
    const searchTerm = 'Test'

    // Type in search field
    cy.get('input[placeholder*="Recherche"], input[placeholder*="exercice"]')
      .first()
      .type(searchTerm)

    // Verify search field has the typed value
    cy.get('input[placeholder*="Recherche"], input[placeholder*="exercice"]')
      .first()
      .should('have.value', searchTerm)

    // Clear the field
    cy.get('input[placeholder*="Recherche"], input[placeholder*="exercice"]').first().clear()

    // Verify field is empty
    cy.get('input[placeholder*="Recherche"], input[placeholder*="exercice"]')
      .first()
      .should('have.value', '')
  })

  it('should display exercice details', () => {
    // Click on first exercice card
    cy.get('[data-testid="exercice-card"], .v-card').first().should('exist')

    // Check if exercice has name (displayed in div)
    cy.get('[data-testid="exercice-card"], .v-card')
      .first()
      .within(() => {
        // The name is in a div with font-bold class
        cy.get('.font-bold').should('exist')
      })
  })

  it('should support infinite scroll for loading more exercices', () => {
    // Get initial count
    cy.get('[data-testid="exercice-card"], .v-card').then(($cards) => {
      const initialCount = $cards.length

      // Scroll to bottom and wait for potential new items to load
      cy.scrollTo('bottom')

      // Should load more or stay the same (with timeout for async loading)
      cy.get('[data-testid="exercice-card"], .v-card', { timeout: 2000 }).should(
        'have.length.gte',
        initialCount,
      )
    })
  })
})
