// ***********************************************************
// This support/e2e.js is processed and loaded automatically
// before your test files.
// ***********************************************************

import "./commands";

// ============================================================
// ESCUDO DE SEGURIDAD PARA BASE DE DATOS (DATABASE SAFETY GUARD)
// ============================================================
// Este bloque se ejecuta antes de CADA prueba en Cypress.
// Intercepta todas las operaciones que puedan modificar datos (POST, PUT, DELETE, PATCH)
// hacia cualquier endpoint de la API (/api/**), respondiendo a nivel de navegador.
//
// De esta manera, aunque el backend (Express/MongoDB) esté encendido y escuchando,
// NINGUNA prueba de Cypress podrá escribir, modificar o sobreescribir datos reales.
// Las pruebas individuales pueden definir intercepts específicos cuando lo requieran,
// y este escudo cubrirá automáticamente cualquier otra petición de escritura.
// ============================================================

beforeEach(() => {
  // 1. Bloqueo global de peticiones que modifican datos (Mutaciones)
  cy.intercept({ method: "POST", url: "**/api/**" }, (req) => {
    req.reply({
      statusCode: 200,
      body: {
        success: true,
        message: "Operación POST simulada de forma segura por Cypress (escudo de BD activo)",
      },
    });
  }).as("globalDbGuardPost");

  cy.intercept({ method: "PUT", url: "**/api/**" }, (req) => {
    req.reply({
      statusCode: 200,
      body: {
        success: true,
        message: "Operación PUT simulada de forma segura por Cypress (escudo de BD activo)",
      },
    });
  }).as("globalDbGuardPut");

  cy.intercept({ method: "DELETE", url: "**/api/**" }, (req) => {
    req.reply({
      statusCode: 200,
      body: {
        success: true,
        message: "Operación DELETE simulada de forma segura por Cypress (escudo de BD activo)",
      },
    });
  }).as("globalDbGuardDelete");

  cy.intercept({ method: "PATCH", url: "**/api/**" }, (req) => {
    req.reply({
      statusCode: 200,
      body: {
        success: true,
        message: "Operación PATCH simulada de forma segura por Cypress (escudo de BD activo)",
      },
    });
  }).as("globalDbGuardPatch");

  // 2. Intercepción segura para consultas que se disparan en segundo plano al autenticarse
  // (por ejemplo el carrito y favoritos del usuario)
  cy.intercept("GET", "**/api/cart/**", {
    statusCode: 200,
    body: { cartId: "mock-cart-safe", items: [] },
  }).as("globalSafeCart");

  cy.intercept("GET", "**/api/wishlist/**", {
    statusCode: 200,
    body: [],
  }).as("globalSafeWishlist");
});
