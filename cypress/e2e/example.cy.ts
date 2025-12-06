// Basic smoke test to verify the app loads
describe('Application Smoke Test', () => {
  it('should load the application successfully', () => {
    cy.visit('/')
    cy.get('body').should('be.visible')
  })

  it('should have a working navigation', () => {
    cy.visit('/')
    cy.get('nav, [role="navigation"]').should('exist')
  })
})
