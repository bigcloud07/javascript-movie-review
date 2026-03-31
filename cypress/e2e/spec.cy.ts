describe("template spec", () => {
  it("passes", () => {
    cy.visit("localhost:5173");
  });

  context("Movie List 탐색", () => {
    cy.get(".item").should('have.length', 20);
    cy.get('.show-more-button');
    cy.get('.show-more-button').click();
    cy.get(".item").should('have.length', 40);
  });

  context("검색 - 결과 있음", () => {
    cy.get('.search-input').type("Inception");
    cy.get(".search-submit").click();
    cy.get(".item")
      .its('length')
      .should('be.gte', 1)
  });

  context("검색 - 결과 있는 경우의 재검색", () => {
    cy.get('.search-input').type("Inception");
    cy.get(".search-submit").click();
    cy.get(".item")
      .its('length')
      .should('be.gte', 1)
    cy.get('.search-input').type("Inception");
    cy.get(".search-submit").click();
    cy.get(".item")
      .its('length')
      .should('be.gte', 1)
  });

  context("검색 - 결과 없음", () => {
    cy.get('.search-input').type("$$%@@");
    cy.get(".search-submit").click();
    cy.contains("검색 결과가 없습니다");
  });
  
  context("검색 - 결과 없는 경우의 재검색", () => {
    cy.get('.search-input').type("$$%@@");
    cy.get(".search-submit").click();
    cy.contains("검색 결과가 없습니다");
    cy.get('.search-input').type("Inception");
    cy.get(".search-submit").click();
    cy.get(".item")
      .its('length')
      .should('be.gte', 1)
  });
});
