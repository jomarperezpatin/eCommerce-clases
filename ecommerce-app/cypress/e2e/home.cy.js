describe("Smoke Test - Página de Inicio", () => {
  it("visita la página de inicio y verifica que carga correctamente", () => {
    cy.visit("/");

    // Verifica que el encabezado principal de la aplicación cargue y esté visible
    cy.get("header.header").should("be.visible");

    // Verifica que el logotipo de la tienda se muestre correctamente
    cy.get("a.logo").should("contain.text", "eShop");

    // Verifica que la barra de búsqueda esté disponible
    cy.get('input[placeholder="Buscar productos..."]').should("be.visible");

    // Verifica que el botón del carrito de compras esté presente en el header
    cy.get("[data-cart-target]").should("be.visible");
  });
});

