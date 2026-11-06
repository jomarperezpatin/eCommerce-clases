describe("Login E2E - Flujo de Autenticación de eShop", () => {
  beforeEach(() => {
    // Limpiamos el almacenamiento local antes de cada prueba para asegurar aislamiento
    cy.clearLocalStorage();
  });

  it("Camino 1: Permite iniciar sesión con credenciales correctas y redirige al inicio", () => {
    // Generamos un payload simulado para el JWT sin tocar la base de datos real
    const mockUser = {
      userId: "65a123456789abcdef012345",
      name: "Usuario Pruebas",
      role: "customer",
    };

    // Codificamos el payload en base64 para formar el token JWT simulado
    const base64Payload = btoa(JSON.stringify(mockUser));
    const mockToken = `header.${base64Payload}.signature`;
    const mockRefreshToken = "header.eyJ1c2VySWQiOiI2NWExMjM0NTY3ODlhYmNkZWYwMTIzNDUifQ.signature";

    // Interceptamos la petición POST de login hacia la API para no tocar la BD real
    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 200,
      body: {
        token: mockToken,
        refreshToken: mockRefreshToken,
      },
    }).as("loginSuccess");

    // 1. Visitamos la página de login
    cy.visit("/login");

    // 2. Verificamos que el formulario esté visible con sus elementos principales
    cy.get(".login-card").should("be.visible");
    cy.get("h2").should("contain.text", "Iniciar Sesión");
    cy.get("input#email").should("be.visible");
    cy.get("input#password").should("be.visible");

    // 3. Ingresamos credenciales válidas del usuario de prueba
    cy.get("input#email").type("usuario.prueba@eshop.com");
    cy.get("input#password").type("PasswordValido123!");

    // 4. Enviamos el formulario
    cy.get('form.login-form button[type="submit"]').click();

    // 5. Esperamos que la llamada a la API simulada responda
    cy.wait("@loginSuccess");

    // 6. Verificamos que redirige al inicio ("/")
    cy.location("pathname", { timeout: 10000 }).should("eq", "/");

    // 7. Verificamos que los tokens quedaron almacenados en localStorage
    cy.window().its("localStorage").invoke("getItem", "authToken").should("exist");
    cy.window().its("localStorage").invoke("getItem", "refreshToken").should("exist");

    // 8. Verificamos que la interfaz refleje el usuario logueado en el encabezado
    cy.get("header.header").should("be.visible");
    cy.get(".greeting").should("contain.text", "Hola, Usuario Pruebas");
    cy.get(".account-text").should("contain.text", "Mi Cuenta");
  });

  it("Camino 2: Muestra mensaje de error al ingresar credenciales incorrectas", () => {
    // Interceptamos la llamada de autenticación simulando credenciales inválidas (código 400)
    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 400,
      body: {
        message: "Invalid Credentials",
      },
    }).as("loginFailed");

    // 1. Visitamos la página de login
    cy.visit("/login");

    // 2. Ingresamos credenciales incorrectas
    cy.get("input#email").type("usuario.invalido@eshop.com");
    cy.get("input#password").type("ContrasenaErronea456");

    // 3. Enviamos el formulario
    cy.get('form.login-form button[type="submit"]').click();

    // 4. Esperamos la respuesta fallida de la API
    cy.wait("@loginFailed");

    // 5. Verificamos que se muestre el mensaje de error en la interfaz
    cy.get(".error-message")
      .should("be.visible")
      .and("contain.text", "Invalid Credentials");

    // 6. Verificamos que la URL permanezca en /login (no permite ingresar)
    cy.location("pathname").should("eq", "/login");

    // 7. Verificamos que NO se haya guardado token en localStorage
    cy.window().its("localStorage").invoke("getItem", "authToken").should("be.null");

    // 8. Verificamos que el botón vuelva a estar disponible para un nuevo intento
    cy.get('form.login-form button[type="submit"]')
      .should("not.be.disabled")
      .and("contain.text", "Iniciar Sesión");
  });
});
