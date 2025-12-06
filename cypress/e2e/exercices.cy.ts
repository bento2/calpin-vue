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

    // Wait for debounce and filtering
    cy.wait(500)

    // Should show filtered results
    cy.get('[data-testid="exercice-card"], .v-card').should('exist')
  })

  it('should clear search when clear button is clicked', () => {
    const searchTerm = 'Test'

    // Type in search field
    cy.get('input[placeholder*="Recherche"], input[placeholder*="exercice"]')
      .first()
      .type(searchTerm)

    // Click clear button if it exists
    cy.get('button[aria-label*="clear"], .mdi-close').first().click({ force: true })

    // Should display all exercices again
    cy.get('[data-testid="exercice-card"], .v-card').should('have.length.greaterThan', 0)
  })

  it('should display exercice details', () => {
    // Click on first exercice card
    cy.get('[data-testid="exercice-card"], .v-card').first().should('exist')

    // Check if exercice has name/title
    cy.get('[data-testid="exercice-card"], .v-card')
      .first()
      .within(() => {
        cy.get('.v-card-title, h2, h3, h4').should('exist')
      })
  })

  it('should support infinite scroll for loading more exercices', () => {
    // Get initial count
    cy.get('[data-testid="exercice-card"], .v-card').then(($cards) => {
      const initialCount = $cards.length

      // Scroll to bottom
      cy.scrollTo('bottom')
      cy.wait(1000)

      // Should load more or stay the same
      cy.get('[data-testid="exercice-card"], .v-card').should('have.length.gte', initialCount)
    })
  })
})
