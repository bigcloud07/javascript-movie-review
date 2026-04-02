describe("template spec", () => {
  beforeEach(() => {
    cy.visit("localhost:5173");
  });

  it("passes", () => {});

  context("Movie List 탐색", () => {
    it("초기 목록 20개 표시 후 더보기 클릭 시 40개 표시", () => {
      cy.get(".item").should("have.length", 20);
      cy.get(".show-more-button");
      cy.get(".show-more-button").click();
      cy.get(".item").should("have.length", 40);
    });
  });

  context("검색 - 결과 있음", () => {
    it("검색 결과가 1개 이상 표시된다", () => {
      cy.get(".search-input").type("Inception");
      cy.get(".search-submit").click();
      cy.get(".item").its("length").should("be.gte", 1);
    });
  });

  context("검색 - 결과 있는 경우의 재검색", () => {
    it("재검색 시에도 결과가 1개 이상 표시된다", () => {
      cy.get(".search-input").type("Inception");
      cy.get(".search-submit").click();
      cy.get(".item").its("length").should("be.gte", 1);
      cy.get(".search-input").type("Inception");
      cy.get(".search-submit").click();
      cy.get(".item").its("length").should("be.gte", 1);
    });
  });

  context("검색 - 결과 없음", () => {
    it("결과 없음 메시지가 표시된다", () => {
      cy.get(".search-input").type("$$%@@");
      cy.get(".search-submit").click();
      cy.contains("검색 결과가 없습니다");
    });
  });

  context("검색 - 결과 없는 경우의 재검색", () => {
    it("결과 없음 후 재검색 시 결과가 표시된다", () => {
      cy.get(".search-input").type("$$%@@");
      cy.get(".search-submit").click();
      cy.contains("검색 결과가 없습니다");
      cy.get(".search-input").type("Inception");
      cy.get(".search-submit").click();
      cy.get(".item").its("length").should("be.gte", 1);
    });
  });
});
