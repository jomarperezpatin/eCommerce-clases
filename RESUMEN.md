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


---

## 8. Documentación de la API con Swagger (`/api-docs`)

Se documentaron **todos los endpoints del backend (`ecommerce-api`)** utilizando OpenAPI 3.0 con `swagger-jsdoc` y la interfaz interactiva con `swagger-ui-express`.

### Configuración principal
* **Ruta de acceso en navegador:** `http://localhost:4000/api-docs`
* **Archivo de configuración:** [`ecommerce-api/src/config/swagger.js`](file:///C:/Indapdos/3Modulo/FS2026-01-Integracion/ecommerce-api/src/config/swagger.js)
* **Punto de montaje condicional:** [`ecommerce-api/server.js`](file:///C:/Indapdos/3Modulo/FS2026-01-Integracion/ecommerce-api/server.js) solo monta `/api-docs` si `process.env.NODE_ENV !== "production"`. En producción, la ruta queda completamente apagada y responde `404 Not Found`, protegiendo la arquitectura de la API contra escaneos públicos.
* **Autenticación en Swagger (`bearerAuth`):** Se configuró el esquema de seguridad Bearer JWT. Esto habilita el botón verde **"Authorize"** en la parte superior derecha de la interfaz, permitiendo pegar un token JWT y probar endpoints protegidos directamente desde Swagger.
* **Modelos y esquemas:** Se definieron esquemas detallados en `components.schemas` con valores de ejemplo para `RegisterInput`, `LoginInput`, `RefreshInput`, `Product`, `Category`, `CartInput`, `AddToCartInput`, `CreateOrderInput`, `UpdateOrderStatusInput`, `PaymentMethodInput`, `AddressInput`, `UserInput`, `UpdateUserInput` y `AddWishlistInput`.

---

### Módulos y endpoints documentados (Total: 44 operaciones en 27 rutas)

| Módulo / Tag | Método | Ruta | Requiere Token (`bearerAuth`) | Rol / Permiso | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | No | Público | Registra un nuevo usuario con carrito inicial vacío |
| **Auth** | `POST` | `/api/auth/login` | No | Público | Inicia sesión y devuelve access token y refresh token |
| **Auth** | `POST` | `/api/auth/refresh` | No | Público | Renueva el access token mediante el refresh token |
| **Products** | `GET` | `/api/products/search` | No | Público | Búsqueda y filtrado avanzado (búsqueda, categoría, precio, stock, orden, paginación) |
| **Products** | `GET` | `/api/products` | No | Público | Lista todos los productos disponibles |
| **Products** | `GET` | `/api/products/{id}` | No | Público | Obtiene el detalle de un producto por su ObjectId |
| **Products** | `POST` | `/api/products` | **Sí** | Admin | Crea un nuevo producto |
| **Products** | `PUT` | `/api/products/{id}` | **Sí** | Admin | Actualiza los datos de un producto |
| **Products** | `DELETE` | `/api/products/{id}` | **Sí** | Admin | Elimina un producto por su ID |
| **Categories** | `GET` | `/api/categories` | No | Público | Lista todas las categorías |
| **Categories** | `GET` | `/api/categories/{id}` | No | Público | Obtiene una categoría por su ObjectId |
| **Categories** | `POST` | `/api/categories` | **Sí** | Admin | Crea una nueva categoría |
| **Categories** | `PUT` | `/api/categories/{id}` | **Sí** | Admin | Actualiza una categoría existente |
| **Categories** | `DELETE` | `/api/categories/{id}` | **Sí** | Admin | Elimina una categoría por su ID |
| **Cart** | `GET` | `/api/cart` | **Sí** | Admin | Lista todos los carritos del sistema |
| **Cart** | `GET` | `/api/cart/{id}` | **Sí** | Admin | Obtiene un carrito por su ID |
| **Cart** | `GET` | `/api/cart/user/{id}` | **Sí** | Mismo usuario o Admin | Obtiene el carrito del usuario especificado |
| **Cart** | `POST` | `/api/cart` | **Sí** | Usuario autenticado | Crea o inicializa un carrito con productos |
| **Cart** | `PUT` | `/api/cart/{id}` | **Sí** | Propietario o Admin | Actualiza la lista completa de productos del carrito |
| **Cart** | `DELETE` | `/api/cart/{id}` | **Sí** | Propietario o Admin | Elimina un carrito por su ID |
| **Cart** | `POST` | `/api/cart/add` | **Sí** | Usuario autenticado | Agrega un producto (o suma cantidad) al carrito del usuario |
| **Orders** | `GET` | `/api/orders` | **Sí** | Admin | Lista todas las órdenes de la tienda |
| **Orders** | `GET` | `/api/orders/my-orders` | **Sí** | Usuario autenticado | Lista las órdenes realizadas por el usuario logueado |
| **Orders** | `GET` | `/api/orders/{id}` | **Sí** | Usuario autenticado | Obtiene el detalle completo de una orden por ID |
| **Orders** | `POST` | `/api/orders` | **Sí** | Usuario autenticado | Crea una nueva orden calculando IVA (16%), envío y totales |
| **Orders** | `PUT` | `/api/orders/{id}` | **Sí** | Admin | Actualiza el estado del pedido o el estado del pago |
| **Payment Methods** | `GET` | `/api/payment-methods` | **Sí** | Usuario autenticado | Lista los métodos de pago guardados del usuario |
| **Payment Methods** | `GET` | `/api/payment-methods/{id}` | **Sí** | Admin | Obtiene un método de pago por su ID |
| **Payment Methods** | `POST` | `/api/payment-methods` | **Sí** | Usuario autenticado | Agrega un método de pago (tarjeta, PayPal, etc.) |
| **Payment Methods** | `PUT` | `/api/payment-methods/{id}` | **Sí** | Usuario autenticado | Actualiza un método de pago existente |
| **Payment Methods** | `DELETE` | `/api/payment-methods/{id}` | **Sí** | Usuario autenticado | Elimina un método de pago |
| **Addresses** | `GET` | `/api/addresses` | **Sí** | Usuario autenticado | Lista las direcciones guardadas del usuario |
| **Addresses** | `GET` | `/api/addresses/{id}` | **Sí** | Usuario autenticado | Obtiene una dirección específica por ID |
| **Addresses** | `POST` | `/api/addresses` | **Sí** | Usuario autenticado | Registra una nueva dirección de envío |
| **Addresses** | `PUT` | `/api/addresses/{id}` | **Sí** | Usuario autenticado | Actualiza una dirección existente |
| **Addresses** | `DELETE` | `/api/addresses/{id}` | **Sí** | Usuario autenticado | Elimina una dirección por su ID |
| **Users** | `GET` | `/api/users` | **Sí** | Admin | Lista todos los usuarios registrados |
| **Users** | `GET` | `/api/users/{id}` | **Sí** | Mismo usuario o Admin | Obtiene el perfil de un usuario por su ID |
| **Users** | `POST` | `/api/users` | **Sí** | Admin | Crea un usuario con rol asignado directamente |
| **Users** | `PUT` | `/api/users/{id}` | **Sí** | Mismo usuario o Admin | Actualiza los datos personales de un usuario |
| **Users** | `DELETE` | `/api/users/{id}` | **Sí** | Admin | Elimina un usuario por su ID |
| **Wishlist** | `GET` | `/api/wishlist` | **Sí** | Usuario autenticado | Obtiene la lista de favoritos del usuario |
| **Wishlist** | `POST` | `/api/wishlist` | **Sí** | Usuario autenticado | Agrega un producto a la lista de deseos |
| **Wishlist** | `DELETE` | `/api/wishlist/products/{productId}` | **Sí** | Usuario autenticado | Quita un producto de la lista de deseos |
| **Wishlist** | `GET` | `/api/wishlist/all` | **Sí** | Admin | Lista todas las listas de deseos del sistema |
| **Wishlist** | `GET` | `/api/wishlist/user/{id}` | **Sí** | Mismo usuario o Admin | Obtiene los favoritos de un usuario en particular |
| **Wishlist** | `DELETE` | `/api/wishlist/{id}` | **Sí** | Usuario autenticado | Elimina una lista de deseos completa |
| **Upload** | `POST` | `/api/upload` | **Sí** | Admin | Sube una imagen a Cloudinary (`multipart/form-data`) |

---

### Cómo levantar y probar Swagger UI

1. En la carpeta `ecommerce-api`, inicia el servidor:
   ```bash
   cd ecommerce-api
   npm start
   # o en modo desarrollo:
   npm run dev
   ```
2. Abre tu navegador en:
   ```
   http://localhost:4000/api-docs
   ```
3. Para probar endpoints con candado (`bearerAuth`):
   * Haz una petición en `/auth/login` con un usuario (o admin).
   * Copia el `token` de la respuesta.
   * Haz clic en el botón verde **Authorize** (arriba a la derecha en Swagger).
   * Pega el token y haz clic en **Authorize** -> **Close**.
   * Ahora puedes probar cualquiera de los endpoints protegidos con **Try it out** -> **Execute**.


---

## 9. Variables de Entorno para Producción (Backend y Frontend)

Para evitar que el proyecto se rompa al desplegar el frontend y el backend en servicios separados y la base de datos en MongoDB Atlas, se eliminaron las URLs fijas a `localhost` y se delegaron a variables de entorno con valores por defecto para seguir trabajando en local sin fricción.

### Cambios realizados en el código

1. **Frontend (`ecommerce-app/src/services/apiClient.js`):**
   * Se configuró `process.env.REACT_APP_API_URL || "http://localhost:4000/api"`.
   * Ahora tanto las llamadas generales (`baseURL`) como la llamada de renovación de sesión (`/auth/refresh`) apuntan dinámicamente a la URL del backend configurada en producción.
   * Se dejó listo el archivo [`ecommerce-app/.env.example`](file:///C:/Indapdos/3Modulo/FS2026-01-Integracion/ecommerce-app/.env.example).

2. **Backend (`ecommerce-api/server.js`):**
   * Se actualizó la configuración de CORS para leer `process.env.CORS_ORIGIN || "http://localhost:3000"`.
   * Ahora soporta múltiples URLs separadas por coma (por ejemplo, si tienes tu dominio oficial y una URL de vista previa en Vercel/Netlify), además de permitir herramientas de prueba como Postman o llamadas servidor a servidor.
   * Se dejó listo el archivo [`ecommerce-api/.env.example`](file:///C:/Indapdos/3Modulo/FS2026-01-Integracion/ecommerce-api/.env.example).

---

### Variables a configurar en Producción (Explicación sencilla)

#### A) En el servicio del Frontend (Vercel, Netlify, Render, etc.)

| Variable | ¿Para qué sirve en palabras simples? | Ejemplo de valor en producción |
| :--- | :--- | :--- |
| `REACT_APP_API_URL` | Es la dirección de internet donde estará viviendo tu backend para que la aplicación web sepa a dónde enviar los datos del login, productos, carrito y compras. **Debe terminar en `/api`**. | `https://mi-api-ecommerce.onrender.com/api` |

> **Nota para React:** Todas las variables de entorno que el navegador necesite leer en Create React App deben empezar obligatoriamente con el prefijo `REACT_APP_`.

---

#### B) En el servicio del Backend (Render, Railway, Fly.io, VPS, etc.)

| Variable | ¿Para qué sirve en palabras simples? | Ejemplo de valor en producción |
| :--- | :--- | :--- |
| `NODE_ENV` | Le avisa a Node.js que está en producción. Activa optimizaciones de velocidad y **apaga automáticamente Swagger (`/api-docs`)** para que nadie de afuera vea la estructura interna de tu API. | `production` |
| `PORT` | El puerto de red donde escucha el servidor. En la mayoría de plataformas en la nube (Render, Railway, Heroku) la plataforma lo asigna sola en automático. | `4000` (o el asignado por la nube) |
| `CORS_ORIGIN` | **Regla de seguridad del navegador.** Le dice a tu backend: *"Solo acepta peticiones que vengan de esta página web"*. Aquí pones la URL pública de tu frontend. Si tienes más de una, puedes separarlas con coma. | `https://mi-tienda-frontend.vercel.app` |
| `MONGODB_URI` | La cadena de conexión a tu base de datos en la nube (MongoDB Atlas). Contiene tu usuario, contraseña y el nombre del cluster. | `mongodb+srv://usuario:password@cluster0.abcde.mongodb.net/ecommerce` |
| `JWT_SECRET` | La clave secreta maestra con la que tu servidor firma los tokens de acceso del usuario. Debe ser una cadena larga y aleatoria. | `c48e7a6829b3f019c...` (64 caracteres) |
| `JWT_REFRESH_TOKEN` | La clave secreta para firmar los tokens de renovación de sesión. Debe ser diferente a `JWT_SECRET`. | `d91e6b8910f2c45a...` (64 caracteres) |
| `JWT_EXPIRES_IN` | Tiempo de vida del token de acceso antes de pedir renovación. | `1h` (1 hora) |
| `JWT_REFRESH_EXPIRES_IN` | Tiempo máximo que una sesión puede permanecer abierta sin volver a pedir usuario y contraseña. | `7d` (7 días) |
| `CLOUDINARY_CLOUD_NAME` | *(Opcional)* Nombre de tu nube en Cloudinary si vas a subir fotos de productos reales. | `mi_cloud_name` |
| `CLOUDINARY_API_KEY` | *(Opcional)* Llave pública de tu cuenta de Cloudinary. | `123456789012345` |
| `CLOUDINARY_API_SECRET` | *(Opcional)* Llave privada de tu cuenta de Cloudinary. | `aBcDeFgHiJkLmNoPqRsTuVw` |
