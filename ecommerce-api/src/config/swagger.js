import swaggerJSDoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-commerce API",
      version: "1.0.0",
      description: "Documentación completa de la API REST para la plataforma E-commerce con autenticación JWT y roles de usuario.",
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || "http://localhost:4000/api",
        description: "Servidor local (/api)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Ingresa el token JWT obtenido en /auth/login",
        },
      },
      schemas: {
        RegisterInput: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Juan Pérez" },
            email: { type: "string", format: "email", example: "juan@example.com" },
            password: { type: "string", minLength: 6, example: "Password123" },
            phone: { type: "string", example: "5512345678" },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "juan@example.com" },
            password: { type: "string", example: "Password123" },
          },
        },
        RefreshInput: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsIn..." },
          },
        },
        Product: {
          type: "object",
          required: ["name", "price"],
          properties: {
            name: { type: "string", example: "Mouse Inalámbrico Ergonómico" },
            description: { type: "string", example: "Mouse con conectividad Bluetooth y 2.4GHz" },
            price: { type: "number", example: 499.99 },
            stock: { type: "integer", example: 50 },
            imagesUrl: {
              type: "array",
              items: { type: "string" },
              example: ["/img/products/placeholder.svg"],
            },
            category: {
              type: "string",
              description: "ID de la categoría (ObjectId)",
              example: "65a123456789abcdef012345",
            },
          },
        },
        Category: {
          type: "object",
          required: ["name", "description"],
          properties: {
            name: { type: "string", example: "Electrónicos" },
            description: { type: "string", example: "Dispositivos y accesorios electrónicos" },
            imageURL: { type: "string", example: "https://placehold.co/800x600.png" },
            parentCategory: {
              type: "string",
              nullable: true,
              description: "ID de categoría padre (opcional)",
              example: null,
            },
          },
        },
        CartItemInput: {
          type: "object",
          required: ["product", "quantity"],
          properties: {
            product: { type: "string", description: "ID del producto", example: "65a123456789abcdef012345" },
            quantity: { type: "integer", minimum: 1, example: 2 },
          },
        },
        CartInput: {
          type: "object",
          required: ["user", "products"],
          properties: {
            user: { type: "string", description: "ID del usuario", example: "65a123456789abcdef012345" },
            products: {
              type: "array",
              items: { $ref: "#/components/schemas/CartItemInput" },
            },
          },
        },
        AddToCartInput: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: { type: "string", description: "ID del producto a agregar", example: "65a123456789abcdef012345" },
            quantity: { type: "integer", minimum: 1, default: 1, example: 1 },
          },
        },
        OrderProductInput: {
          type: "object",
          required: ["productId", "quantity"],
          properties: {
            productId: { type: "string", example: "65a123456789abcdef012345" },
            quantity: { type: "integer", minimum: 1, example: 1 },
          },
        },
        CreateOrderInput: {
          type: "object",
          required: ["products", "address", "paymentMethod"],
          properties: {
            products: {
              type: "array",
              items: { $ref: "#/components/schemas/OrderProductInput" },
            },
            address: { type: "string", description: "ID de la dirección de envío", example: "65a123456789abcdef012345" },
            paymentMethod: { type: "string", description: "ID del método de pago", example: "65a123456789abcdef012345" },
          },
        },
        UpdateOrderStatusInput: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
              example: "processing",
            },
            paymentStatus: {
              type: "string",
              enum: ["pending", "paid", "failed", "refunded"],
              example: "paid",
            },
          },
        },
        PaymentMethodInput: {
          type: "object",
          required: ["type"],
          properties: {
            type: {
              type: "string",
              enum: ["credit_card", "debit_card", "paypal", "bank_transfer", "cash_on_delivery"],
              example: "credit_card",
            },
            cardNumber: { type: "string", maxLength: 19, example: "4532-1234-5678-9012" },
            cardHolderName: { type: "string", example: "Juan Pérez" },
            expiryDate: { type: "string", example: "12/28" },
            paypalEmail: { type: "string", example: "juan@example.com" },
            bankName: { type: "string", example: "BBVA" },
            accountNumber: { type: "string", example: "1234567890" },
            isDefault: { type: "boolean", default: false, example: true },
          },
        },
        AddressInput: {
          type: "object",
          required: ["name", "address", "city", "postalCode", "country"],
          properties: {
            name: { type: "string", example: "Casa" },
            address: { type: "string", example: "Av. Insurgentes Sur 123" },
            city: { type: "string", example: "Ciudad de México" },
            state: { type: "string", example: "CDMX" },
            postalCode: { type: "string", example: "06600" },
            country: { type: "string", example: "México" },
            phone: { type: "string", example: "5512345678" },
            isDefault: { type: "boolean", default: false, example: true },
            addressType: {
              type: "string",
              enum: ["home", "work", "other"],
              default: "home",
              example: "home",
            },
          },
        },
        UserInput: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Carlos Gómez" },
            email: { type: "string", format: "email", example: "carlos@example.com" },
            password: { type: "string", minLength: 6, example: "Secret123" },
            phone: { type: "string", example: "5587654321" },
            role: {
              type: "string",
              enum: ["customer", "admin"],
              default: "customer",
              example: "customer",
            },
          },
        },
        UpdateUserInput: {
          type: "object",
          properties: {
            name: { type: "string", example: "Carlos Gómez" },
            email: { type: "string", format: "email", example: "carlos@example.com" },
            phone: { type: "string", example: "5587654321" },
            role: {
              type: "string",
              enum: ["customer", "admin"],
              example: "customer",
            },
          },
        },
        AddWishlistInput: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: { type: "string", description: "ID del producto", example: "65a123456789abcdef012345" },
          },
        },
      },
    },
  },
  apis: [
    "./src/routes/*.js",
    path.join(__dirname, "../routes/*.js"),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
