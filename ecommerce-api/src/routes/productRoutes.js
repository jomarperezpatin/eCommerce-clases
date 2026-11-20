import express from "express";
import { body, param } from "express-validator";
import {
  searchProducts,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const productIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
];

const createProductValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("Category must be a valid MongoDB ObjectId"),
];

const updateProductValidation = [
  param("id")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  // null permite quitarle la categoria al producto
  body("category")
    .optional({ values: "null" })
    .isMongoId()
    .withMessage("Category must be a valid MongoDB ObjectId"),
];

/**
 * @openapi
 * /products/search:
 *   get:
 *     summary: Búsqueda y filtrado avanzado de productos
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda en nombre y descripción
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: ID o nombre de categoría
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Precio máximo
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filtrar por disponibilidad de inventario
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price, name, createdAt]
 *         description: Campo para ordenar
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Dirección del ordenamiento
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de productos por página
 *     responses:
 *       200:
 *         description: Resultados de la búsqueda con datos de paginación
 */
router.get("/products/search", searchProducts);

/**
 * @openapi
 * /products:
 *   get:
 *     summary: Lista todos los productos 
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Un arreglo de productos 
 */
router.get("/products", getProducts);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Obtiene el detalle de un producto por su ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto (ObjectId)
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Producto no encontrado
 */
router.get("/products/:id", productIdValidation, validate, getProductById);

/**
 * @openapi
 * /products:
 *   post:
 *     summary: Crea un nuevo producto (solo para administradores)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Datos de producto inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere rol de administrador)
 */
router.post(
  "/products",
  authMiddleware,
  isAdmin,
  createProductValidation,
  validate,
  createProduct,
);

/**
 * @openapi
 * /products/{id}:
 *   put:
 *     summary: Actualiza un producto existente (solo administradores)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere rol de administrador)
 *       404:
 *         description: Producto no encontrado
 */
router.put(
  "/products/:id",
  authMiddleware,
  isAdmin,
  updateProductValidation,
  validate,
  updateProduct,
);

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     summary: Elimina un producto por su ID (solo administradores)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     responses:
 *       204:
 *         description: Producto eliminado exitosamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere rol de administrador)
 *       404:
 *         description: Producto no encontrado
 */
router.delete(
  "/products/:id",
  authMiddleware,
  isAdmin,
  productIdValidation,
  validate,
  deleteProduct,
);

export default router;
