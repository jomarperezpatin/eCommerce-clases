# Resumen de Configuración y Pruebas E2E con Cypress

En este documento se explica de forma sencilla y directa qué se instaló, cómo funcionan las pruebas E2E, cómo está blindada la base de datos real y el detalle de cada prueba realizada en el frontend (`ecommerce-app`).

---

## 1. ¿Qué se instaló y configuró?

* **Cypress (`cypress@^16.2.1`)**: Herramienta de pruebas **End-to-End (E2E)** que levanta un navegador web real y prueba la aplicación tal y como la usaría un cliente real (escribir en inputs, hacer clics, verificar navegación y respuestas visuales).
* **`cypress.config.js`**: Configurado con `baseUrl: "http://localhost:3000"` apuntando al frontend local.
* **Estructura organizada en `ecommerce-app/cypress/`**:
  * `e2e/`: Pruebas automatizadas (`home.cy.js` y `login.cy.js`).
  * `support/`: Scripts de soporte global y escudo de seguridad (`e2e.js`).
  * `fixtures/`: Datos estáticos simulados.
* **Scripts en `package.json`**:
  * `npm run cy:run` o `npm run cypress:run`: Ejecuta las pruebas en la terminal (modo rápido / headless).
  * `npm run cy:open` o `npm run cypress:open`: Abre la interfaz gráfica con navegador interactivo.

---

## 2. Blindaje de la Base de Datos Real (Escudo Global)

### ¿Por qué existía riesgo antes?
Si tenías tu backend (`ecommerce-api`) y MongoDB encendidos en segundo plano, cualquier petición de escritura (`POST`, `PUT`, `DELETE` o `PATCH`) enviada por el navegador durante una prueba de Cypress podía llegar a la API real y escribir o sobreescribir datos en tu base de datos de MongoDB.

### ¿Cómo se arregló para que NUNCA sobreescriba?
Se implementó un **Escudo Global de Seguridad** en [`cypress/support/e2e.js`](file:///c:/Indapdos/3Modulo/FS2026-01-Integracion/ecommerce-app/cypress/support/e2e.js).

Este escudo se activa automáticamente **antes de cada prueba (`beforeEach`)**:
1. **Captura todas las mutaciones a `/api/**`:** Intercepta todas las peticiones con método `POST`, `PUT`, `DELETE` y `PATCH` que salgan hacia cualquier ruta de la API.
2. **Responde a nivel de navegador:** Cypress contesta inmediatamente la petición dentro del navegador con una respuesta simulada y segura (`req.reply(...)`).
3. **Cero tráfico al servidor:** Al contestarse a nivel interno del navegador, **la petición HTTP física NUNCA viaja por la red ni toca tu backend Express ni MongoDB**.
4. **Protección de peticiones automáticas:** También intercepta consultas en segundo plano como `/api/cart/**` y `/api/wishlist/**`, para que el carrito o los favoritos no intenten sincronizar datos reales al autenticar usuarios.

> **Garantía:** Puedes correr `npm run cy:run` o `npm run cy:open` teniendo tu backend y base de datos prendidos con total tranquilidad: **ningún dato real será modificado o sobreescrito**.

---

## 3. Pruebas E2E del Flujo de Login (`login.cy.js`)

### ¿Cómo funciona el login real de la aplicación?
1. El usuario entra en `/login` y escribe su correo y contraseña.
2. Al presionar **"Iniciar Sesión"**, el formulario envía una petición `POST` al endpoint `/api/auth/login`.
3. Si las credenciales son válidas, la API devuelve un token JWT (`token`) y un `refreshToken`.
4. La aplicación guarda estos tokens en `localStorage` (`authToken` y `refreshToken`) y redirige al usuario a la página de inicio (`/`), donde el encabezado lee el token y muestra el nombre del usuario logueado.
5. Si las credenciales no coinciden, la API responde con un error y la aplicación muestra un mensaje de alerta en pantalla (`.error-message`) sin redirigir al usuario.

---

### Detalle de los caminos probados:

#### Camino 1: Credenciales correctas (El usuario entra con éxito)
* **Qué se probó:**
  1. Se visita la página `/login`.
  2. Se verifica que el formulario, los campos de email y contraseña y el botón estén visibles.
  3. Se escribe el correo (`usuario.prueba@eshop.com`) y la contraseña de un usuario de prueba.
  4. Se intercepta la petición a `/api/auth/login` y se responde con un JWT simulado que contiene el nombre `"Usuario Pruebas"`.
  5. Se presiona el botón de envío del formulario (`form.login-form button[type="submit"]`).
  6. Se valida que la aplicación redirige exitosamente a la página principal (`/`).
  7. Se valida que el `authToken` y `refreshToken` se guardaron en `localStorage`.
  8. Se valida que el encabezado ahora saluda al usuario con su nombre (`"Hola, Usuario Pruebas"`) y muestra el enlace a `"Mi Cuenta"`.
* **Resultado:** **Aprobado (PASSED)**.

#### Camino 2: Credenciales incorrectas (El usuario ve un error)
* **Qué se probó:**
  1. Se visita la página `/login`.
  2. Se ingresan credenciales erróneas (`usuario.invalido@eshop.com` y clave falsa).
  3. Se intercepta la petición simulando el rechazo de la API (código `400` con el mensaje `"Invalid Credentials"`).
  4. Se presiona el botón de envío del formulario.
  5. Se valida que aparece el mensaje de error visible en pantalla con el texto `"Invalid Credentials"`.
  6. Se valida que el usuario permanece en la ruta `/login` (no se le permite el acceso).
  7. Se valida que **NO** se guardó ningún token en `localStorage` (sigue en `null`).
  8. Se valida que el botón de inicio de sesión vuelve a estar activo para que el usuario pueda corregir sus datos.
* **Resultado:** **Aprobado (PASSED)**.

---

## 4. Prueba de Humo de la Página de Inicio (`home.cy.js`)
* **Qué se probó:**
  * Visita a la raíz `/`.
  * Verificación de visibilidad del encabezado (`header.header`), logotipo (`eShop`), barra de búsqueda y botón del carrito.
* **Resultado:** **Aprobado (PASSED)**.

---

## 5. Resumen Global de Ejecución

Al ejecutar la suite completa con `npm run cy:run`:

```text
       Spec                                              Tests  Passing  Failing  
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ √  home.cy.js                               00:19        1        1        0 │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ √  login.cy.js                              00:17        2        2        0 │
  └─────────────────────────────────────────────────────────────────────────────┘
    √  All specs passed!                        00:36        3        3        0  
```

* **Total de pruebas:** 3
* **Pruebas aprobadas:** 3 (100%)
* **Pruebas fallidas:** 0
* **Tiempo total:** ~36 segundos

---

## 6. Instrucciones para correr las pruebas

1. Ten corriendo el frontend en una consola:
   ```bash
   cd ecommerce-app
   npm start
   ```

2. En otra consola corre:
   * **Modo consola (rápido):**
     ```bash
     cd ecommerce-app
     npm run cy:run
     ```
   * **Solo las pruebas de login:**
     ```bash
     cd ecommerce-app
     npx cypress run --spec "cypress/e2e/login.cy.js"
     ```
   * **Modo visual interactivo:**
     ```bash
     cd ecommerce-app
     npm run cy:open
     ```


---

## 7. Integración Continua (CI/CD) en GitHub Actions (`frontend.yml`)

El flujo de trabajo en `.github/workflows/frontend.yml` ejecuta tanto las pruebas unitarias como las pruebas E2E de Cypress en cada `push` o `pull_request` a `main`:

1. **Instalación:** Configura Node 20 y ejecuta `npm install`.
2. **Pruebas unitarias:** Ejecuta `npm test -- --watchAll=false` (Jest + React Testing Library).
3. **Compilación de producción:** Ejecuta `npm run build` para generar los archivos estáticos optimizados.
4. **Pruebas E2E automáticas:** Utiliza la acción oficial `cypress-io/github-action@v6` para:
   * Servir la build estática en `http://localhost:3000` con `npx serve`.
   * Esperar a que el puerto esté listo (`wait-on`).
   * Correr las pruebas E2E (`home.cy.js` y `login.cy.js`) en entorno Linux con Xvfb gestionado.
5. **Captura de artefactos:** Si alguna prueba llegara a fallar, sube automáticamente las capturas de pantalla tomadas por Cypress para facilitar la depuración desde la interfaz de GitHub.
