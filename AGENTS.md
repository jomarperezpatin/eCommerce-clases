# Memoria del Proyecto - FS2026-01-Integracion

Monorepo compuesto por dos subproyectos independientes: `ecommerce-api` (backend) y `ecommerce-app` (frontend).

---

## 1. Estructura de Carpetas de `src/`

### `ecommerce-api/src/`
```
ecommerce-api/
├── server.js                        # Punto de entrada de la API Express
├── .env
├── package.json
└── src/
    ├── config/                      # Configuraciones de conexiones externas
    │   ├── cloudinary.conf.js       # Instancia Cloudinary v2
    │   └── db.conf.js               # Conexión Mongoose a MongoDB
    ├── controllers/                 # Controladores con la lógica de negocio
    │   ├── addressController.js
    │   ├── authController.js
    │   ├── cartController.js
    │   ├── categoryController.js
    │   ├── orderController.js
    │   ├── paymentMethodController.js
    │   ├── productController.js
    │   ├── uploadController.js
    │   ├── userController.js
    │   └── wishlistController.js
    ├── middlewares/                 # Middlewares de Express
    │   ├── authMiddleware.js
    │   ├── errorHandler.js
    │   ├── isAdminMiddleware.js
    │   ├── isSelfOrAdminMiddleware.js
    │   ├── logger.js
    │   ├── uploadMiddleware.js
    │   └── validation.js
    ├── models/                      # Esquemas y modelos de Mongoose
    │   ├── Address.js
    │   ├── Cart.js
    │   ├── Category.js
    │   ├── Order.js
    │   ├── PaymentMethod.js
    │   ├── Product.js
    │   ├── User.js
    │   └── WishList.js
    ├── routes/                      # Definición de rutas
    │   ├── addressRoutes.js
    │   ├── authRoutes.js
    │   ├── cartRoutes.js
    │   ├── categoryRoutes.js
    │   ├── index.js                 # Router principal montado en /api
    │   ├── orderRoutes.js
    │   ├── paymentMethodRoutes.js
    │   ├── productRoutes.js
    │   ├── uploadRoutes.js
    │   ├── userRoutes.js
    │   └── wishlistRoutes.js
    └── seed/
        └── productsCategories.js    # Script de inicialización de datos
```

### `ecommerce-app/src/`
```
ecommerce-app/src/
├── index.js                         # Renderizado principal con ThemeProvider
├── index.css                        # Variables CSS, paleta de colores y resets
├── setupTests.js                    # Configuración de Jest DOM (@testing-library/jest-dom)
├── components/                      # Componentes React
│   ├── Admin/
│   │   ├── ImageUpload/
│   │   │   ├── ImageUpload.jsx
│   │   │   └── ImageUpload.css
│   │   ├── ProductForm/
│   │   │   ├── ProductForm.jsx
│   │   │   └── ProductForm.css
│   │   └── ProductTable/
│   │       ├── ProductTable.jsx
│   │       └── ProductTable.css
│   ├── App/
│   │   ├── App.jsx
│   │   └── index.js
│   ├── BannerCarousel/
│   │   ├── BannerCarousel.jsx
│   │   ├── BannerCarousel.css
│   │   └── index.js
│   ├── Cart/
│   │   ├── CartView.jsx
│   │   ├── CartView.css
│   │   ├── StockNotice.jsx
│   │   └── StockNotice.css
│   ├── CategoryProducts/
│   │   ├── CategoryProducts.jsx
│   │   └── CategoryProducts.css
│   ├── Checkout/
│   │   ├── Address/
│   │   │   ├── AddressForm.jsx
│   │   │   ├── AddressForm.css
│   │   │   ├── AddressItem.jsx
│   │   │   ├── AddressItem.css
│   │   │   ├── AddressList.jsx
│   │   │   └── AddressList.css
│   │   ├── Payment/
│   │   │   ├── PaymentForm.jsx
│   │   │   ├── PaymentForm.css
│   │   │   ├── PaymentItem.jsx
│   │   │   ├── PaymentItem.css
│   │   │   ├── PaymentList.jsx
│   │   │   └── PaymentList.css
│   │   └── shared/
│   │       ├── SummarySection.jsx
│   │       └── SummarySection.css
│   ├── common/
│   │   ├── AddToCartButton/
│   │   │   ├── AddToCartButton.jsx
│   │   │   └── AddToCartButton.css
│   │   ├── Badge/
│   │   │   ├── Badge.jsx
│   │   │   ├── Badge.css
│   │   │   └── index.js
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   ├── Button.css
│   │   │   └── index.js
│   │   ├── ErrorMessage/
│   │   │   ├── ErrorMessage.jsx
│   │   │   └── ErrorMessage.css
│   │   ├── Icon/
│   │   │   ├── Icon.jsx
│   │   │   └── Icon.css
│   │   ├── Input/
│   │   │   ├── Input.jsx
│   │   │   ├── Input.css
│   │   │   └── index.js
│   │   └── Loading/
│   │       ├── Loading.jsx
│   │       └── Loading.css
│   ├── List/
│   │   ├── List.jsx
│   │   └── List.css
│   ├── LoginForm/
│   │   ├── LoginForm.jsx
│   │   └── LoginForm.css
│   ├── ProductCard/
│   │   ├── ProductCard.jsx
│   │   └── ProductCard.css
│   ├── ProductDetails/
│   │   ├── ProductDetails.jsx
│   │   └── ProductDetails.css
│   ├── ProfileCard/
│   │   ├── ProfileCard.jsx
│   │   ├── ProfileCard.css
│   │   └── ProfileForm.jsx
│   ├── RegisterForm/
│   │   ├── RegisterForm.jsx
│   │   └── RegisterForm.css
│   ├── SearchResultsList/
│   │   ├── SearchResultsList.jsx
│   │   └── SearchResultsList.css
│   └── WishList/
│       ├── WishlistItem.jsx
│       └── WishlistItem.css
├── context/                         # Contextos globales
│   ├── CartContext.jsx
│   ├── ThemeContext.jsx
│   └── WishlistContext.jsx
├── data/
│   └── homeImages.json              # Datos estáticos para carrusel de Home
├── layout/
│   ├── Breadcrumb/
│   │   ├── Breadcrumb.jsx
│   │   └── Breadcrumb.css
│   ├── Footer/
│   │   ├── Footer.jsx
│   │   └── Footer.css
│   ├── Header/
│   │   ├── Header.jsx
│   │   └── Header.css
│   ├── Layout.jsx
│   ├── Layout.css
│   ├── Navigation/
│   │   ├── Navigation.jsx
│   │   └── Navigation.css
│   └── Newsletter/
│       ├── Newsletter.jsx
│       └── Newsletter.css
├── pages/
│   ├── AdminProductForm.jsx
│   ├── AdminProducts.jsx
│   ├── AdminProducts.css
│   ├── Cart.jsx
│   ├── Cart.css
│   ├── CategoryPage.jsx
│   ├── Checkout.jsx
│   ├── Checkout.css
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── OrderConfirmation.jsx
│   ├── OrderConfirmation.css
│   ├── Orders.jsx
│   ├── Orders.css
│   ├── Product.jsx
│   ├── Profile.jsx
│   ├── ProtectedRoute.jsx
│   ├── Register.jsx
│   ├── SearchResults.jsx
│   ├── Settings.jsx
│   ├── WishList.jsx
│   └── WishList.css
├── services/                        # Llamadas HTTP vía Axios
│   ├── apiClient.js                 # Instancia con base URL e interceptores de token/refresh
│   ├── authService.js
│   ├── cartService.js
│   ├── categoriesService.js
│   ├── orderService.js
│   ├── paymentService.js
│   ├── productsService.js
│   ├── shippingService.js
│   ├── uploadService.js
│   ├── usersService.js
│   └── wishlistService.js
└── utils/
    ├── auth.js                      # Manejo de JWT en localStorage y decodificación
    ├── carryToCart.js               # Animación del carrito recolector
    ├── carryToCart.css
    ├── flyToCart.js                 # Animación física Bézier al carrito
    └── flyToCart.css
```

---

## 2. Mapa de Rutas del Backend

Todas las rutas cuelgan de `/api` (`app.use("/api", routes)` en `server.js`).

| Método | Path Completo | Requiere Auth | Requiere Admin / Permiso |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | No | No (Público) |
| **POST** | `/api/auth/login` | No | No (Público) |
| **POST** | `/api/auth/refresh` | No | No (Público) |
| **GET** | `/api/cart` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **GET** | `/api/cart/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **GET** | `/api/cart/user/:id` | Sí (`authMiddleware`) | `isSelfOrAdmin` (Mismo usuario o Admin) |
| **POST** | `/api/cart` | Sí (`authMiddleware`) | No |
| **PUT** | `/api/cart/:id` | Sí (`authMiddleware`) | No |
| **DELETE** | `/api/cart/:id` | Sí (`authMiddleware`) | No |
| **POST** | `/api/cart/add` | Sí (`authMiddleware`) | No |
| **GET** | `/api/categories` | No | No (Público) |
| **GET** | `/api/categories/:id` | No | No (Público) |
| **POST** | `/api/categories` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **PUT** | `/api/categories/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **DELETE** | `/api/categories/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **GET** | `/api/orders` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **GET** | `/api/orders/my-orders` | Sí (`authMiddleware`) | No |
| **GET** | `/api/orders/:id` | Sí (`authMiddleware`) | No |
| **POST** | `/api/orders` | Sí (`authMiddleware`) | No |
| **PUT** | `/api/orders/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **GET** | `/api/payment-methods` | Sí (`authMiddleware`) | No |
| **GET** | `/api/payment-methods/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **POST** | `/api/payment-methods` | Sí (`authMiddleware`) | No |
| **PUT** | `/api/payment-methods/:id` | Sí (`authMiddleware`) | No |
| **DELETE** | `/api/payment-methods/:id` | Sí (`authMiddleware`) | No |
| **GET** | `/api/products/search` | No | No (Público) |
| **GET** | `/api/products` | No | No (Público) |
| **GET** | `/api/products/:id` | No | No (Público) |
| **POST** | `/api/products` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **PUT** | `/api/products/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **DELETE** | `/api/products/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **GET** | `/api/users` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **GET** | `/api/users/:id` | Sí (`authMiddleware`) | `isSelfOrAdmin` (Mismo usuario o Admin) |
| **POST** | `/api/users` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **PUT** | `/api/users/:id` | Sí (`authMiddleware`) | `isSelfOrAdmin` (Mismo usuario o Admin) |
| **DELETE** | `/api/users/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **GET** | `/api/wishlist` | Sí (`authMiddleware`) | No |
| **POST** | `/api/wishlist` | Sí (`authMiddleware`) | No |
| **DELETE** | `/api/wishlist/products/:productId` | Sí (`authMiddleware`) | No |
| **GET** | `/api/wishlist/all` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **GET** | `/api/wishlist/user/:id` | Sí (`authMiddleware`) | `isSelfOrAdmin` (Mismo usuario o Admin) |
| **DELETE** | `/api/wishlist/:id` | Sí (`authMiddleware`) | No |
| **GET** | `/api/addresses` | Sí (`authMiddleware`) | No |
| **GET** | `/api/addresses/:id` | Sí (`authMiddleware`) | No |
| **POST** | `/api/addresses` | Sí (`authMiddleware`) | No |
| **PUT** | `/api/addresses/:id` | Sí (`authMiddleware`) | No |
| **DELETE** | `/api/addresses/:id` | Sí (`authMiddleware`) | No |
| **POST** | `/api/upload` | Sí (`authMiddleware`) | Sí (`isAdmin`) |

---

## 3. Modelos de Mongoose

Todos los modelos incorporan `{ timestamps: true }`.

* **`User`** (`src/models/User.js`):
  * `name`: String, required, trim
  * `email`: String, required, unique, trim, lowercase
  * `password`: String, required
  * `phone`: String, trim
  * `role`: String, enum: `["customer", "admin"]`, default: `"customer"`

* **`Cart`** (`src/models/Cart.js`):
  * `user`: ObjectId (ref: `User`), required
  * `products`: Array de `{ product: ObjectId (ref: Product, required), quantity: Number (required, min 1) }`

* **`Category`** (`src/models/Category.js`):
  * `name`: String, required, trim
  * `description`: String, required
  * `imageURL`: String, required, default: `"https://placehold.co/800x600.png"`
  * `parentCategory`: ObjectId (ref: `Category`), default: `null`

* **`Order`** (`src/models/Order.js`):
  * `user`: ObjectId (ref: `User`), required
  * `products`: Array de `{ productId: ObjectId (ref: Product, required), quantity: Number (required, min 1), price: Number (required) }`
  * `address`: ObjectId (ref: `Address`), required
  * `paymentMethod`: ObjectId (ref: `PaymentMethod`), required
  * `subtotal`: Number, required (calculado por el servidor: suma de precio × cantidad)
  * `taxAmount`: Number, required (calculado por el servidor: subtotal × 0.16)
  * `shippingCost`: Number, required, default: 0 (calculado por el servidor: 0 si subtotal ≥ 1000, sino 350)
  * `totalPrice`: Number, required (calculado por el servidor: subtotal + taxAmount + shippingCost)
  * `status`: String, enum: `["pending", "processing", "shipped", "delivered", "cancelled"]`, default: `"pending"`
  * `paymentStatus`: String, enum: `["pending", "paid", "failed", "refunded"]`, default: `"pending"`

* **`PaymentMethod`** (`src/models/PaymentMethod.js`):
  * `user`: ObjectId (ref: `User`), required
  * `type`: String, required, enum: `["credit_card", "debit_card", "paypal", "bank_transfer", "cash_on_delivery"]`
  * `cardNumber`: String, maxLength: 19
  * `cardHolderName`: String, trim
  * `expiryDate`: String
  * `paypalEmail`: String
  * `bankName`: String
  * `accountNumber`: String
  * `isDefault`: Boolean, default: false

* **`Product`** (`src/models/Product.js`):
  * `name`: String, required, trim
  * `description`: String
  * `price`: Number, required
  * `stock`: Number, default: 0
  * `imagesUrl`: `[String]`, default: `["/img/products/placeholder.svg"]`
  * `category`: ObjectId (ref: `Category`)

* **`WishList`** (`src/models/WishList.js`):
  * `user`: ObjectId (ref: `User`), required
  * `products`: Array de ObjectId (ref: `Product`), required

* **`Address`** (`src/models/Address.js`):
  * `user`: ObjectId (ref: `User`), required
  * `name`: String, required, trim
  * `address`: String, required, trim
  * `city`: String, required, trim
  * `state`: String, trim
  * `postalCode`: String, required, minLength: 4, maxLength: 6, trim
  * `country`: String, required, trim
  * `phone`: String, maxLength: 10, trim
  * `isDefault`: Boolean, default: false
  * `addressType`: String, enum: `["home", "work", "other"]`, default: `"home"`

---

## 4. Middlewares de Seguridad

Ubicados en `ecommerce-api/src/middlewares/`:

* **`authMiddleware`**:
  * Lee el encabezado `Authorization: Bearer <token>`.
  * Si falta el token, responde con status `401` (`{ message: "Unauthorized" }`).
  * Valida el token con `jwt.verify(token, process.env.JWT_SECRET)`.
  * Si es inválido o expiró, responde con status `401` (`{ message: "Invalid or expired token" }`).
  * Si es válido, asume el payload en `req.user` y llama a `next()`.

* **`isAdmin`**:
  * Comprueba que `req.user` exista (si no, responde `401` con `{ message: "Authentication is required" }`).
  * Verifica si `req.user.role === "admin"`.
  * Si no es administrador, responde con status `403` (`{ message: "Admin access required" }`).
  * Si es administrador, continúa con `next()`.

* **`isSelfOrAdmin`**:
  * Comprueba que `req.user` exista (si no, responde `401` con `{ message: "Authentication is required" }`).
  * Comprueba si el ID del token (`req.user.userId`) coincide con el parámetro de la ruta (`req.params.id`) o si `req.user.role === "admin"`.
  * Si no se cumple ninguna de las dos condiciones, responde con status `403` (`{ message: "Access denied" }`).
  * Si se cumple, llama a `next()`.

---

## 5. Patrón de Código del Proyecto

* **Backend (`ecommerce-api`)**:
  * **ES Modules nativo**: `"type": "module"` en `package.json`, uso de `import` y `export` con extensiones de archivo explícitas (`.js`).
  * **Arquitectura por capas**: Rutas (`routes/`) -> Controladores (`controllers/`) -> Modelos (`models/`), con validación de entrada desacoplada mediante `express-validator` (`middlewares/validation.js`).
* **Frontend (`ecommerce-app`)**:
  * **Componentes funcionales con Hooks**: Estructuración exclusivamente funcional de componentes con hooks de React (`useState`, `useEffect`, `useContext`, `useCallback`, `useMemo`, `useRef`) y hooks de React Router v7 (`useNavigate`, `useParams`, `useSearchParams`, `useLocation`).
  * **Gestión de estado global con Context API**: `CartContext`, `ThemeContext` y `WishlistContext`.
  * **Capa de Servicios con Axios**: Peticiones encapsuladas en `src/services/*`, centralizadas en `apiClient.js` con interceptores para inyección de token JWT y renovación automática vía endpoint `/auth/refresh` ante códigos 401.

---

## 6. Testing

* El frontend usa **Create React App**, por lo que los tests se corren con `"npm test"` (Jest + React Testing Library), **NO** con Vitest.
* **Librerías instaladas**:
  * `@testing-library/react` (`^16.3.0`)
  * `@testing-library/user-event` (`^14.6.8` en `devDependencies`)
  * `@testing-library/jest-dom` (`^6.8.0`) configurado en `src/setupTests.js`
* **Regla para `user-event` v14**: Las interacciones deben ser asíncronas e iniciadas con `const user = userEvent.setup();` (e.g. `await user.click(...)`), no con métodos síncronos legados de v13.
* Los tests de componentes van ubicados en la misma carpeta junto al componente correspondiente, bajo el formato `NombreComponente.test.jsx`.
* Se prueba lo que ve el usuario (textos, botones, estados y comportamientos en el DOM), no los detalles internos o de implementación del componente.
