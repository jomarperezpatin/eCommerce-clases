import express from "express";
import { body, param } from "express-validator";
import {
  getCarts,
  getCartById,
  getCartByUser,
  createCart,
  updateCart,
  deleteCart,
  addProductToCart,
} from "../controllers/cartController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import isSelfOrAdmin from "../middlewares/isSelfOrAdminMiddleware.js";

const router = express.Router();

const cartIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Cart ID must be a valid MongoDB ObjectId"),
];

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const createCartValidation = [
  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("products")
    .optional()
    .isArray()
    .withMessage("Products must be an array"),
  body("products.*.product")
    .isMongoId()
    .withMessage("Each product must be a valid MongoDB ObjectId"),
  body("products.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
];

const putCartValidation = [
  param("id")
    .isMongoId()
    .withMessage("Cart ID must be a valid MongoDB ObjectId"),
  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("products")
    .notEmpty()
    .withMessage("Products array is required")
    .isArray()
    .withMessage("Products must be an array"),
  body("products.*.product")
    .notEmpty()
    .withMessage("Each product item must include product ID")
    .isMongoId()
    .withMessage("Each product must be a valid MongoDB ObjectId"),
  body("products.*.quantity")
    .notEmpty()
    .withMessage("Each product item must include quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
];

/**
 * @openapi
 * /cart:
 *   get:
 *     summary: Lista todos los carritos (solo administradores)
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de carritos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere rol de administrador)
 */
router.get("/cart", authMiddleware, isAdmin, getCarts);

/**
 * @openapi
 * /cart/{id}:
 *   get:
 *     summary: Obtiene un carrito por su ID (solo administradores)
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del carrito
 *     responses:
 *       200:
 *         description: Carrito encontrado
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Carrito no encontrado
 */
router.get(
  "/cart/:id",
  authMiddleware,
  isAdmin,
  cartIdValidation,
  validate,
  getCartById,
);

/**
 * @openapi
 * /cart/user/{id}:
 *   get:
 *     summary: Obtiene el carrito de un usuario específico
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Carrito del usuario
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (solo propio usuario o admin)
 */
router.get(
  "/cart/user/:id",
  authMiddleware,
  isSelfOrAdmin,
  userIdValidation,
  validate,
  getCartByUser,
);

/**
 * @openapi
 * /cart:
 *   post:
 *     summary: Crea un nuevo carrito con productos
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartInput'
 *     responses:
 *       201:
 *         description: Carrito creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
router.post(
  "/cart",
  authMiddleware,
  createCartValidation,
  validate,
  createCart,
);

/**
 * @openapi
 * /cart/{id}:
 *   put:
 *     summary: Actualiza el contenido completo de un carrito
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del carrito
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartInput'
 *     responses:
 *       200:
 *         description: Carrito actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Carrito no encontrado
 */
router.put(
  "/cart/:id",
  authMiddleware,
  putCartValidation,
  validate,
  updateCart,
);

/**
 * @openapi
 * /cart/{id}:
 *   delete:
 *     summary: Elimina un carrito por su ID
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del carrito a eliminar
 *     responses:
 *       204:
 *         description: Carrito eliminado
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Carrito no encontrado
 */
router.delete(
  "/cart/:id",
  authMiddleware,
  cartIdValidation,
  validate,
  deleteCart,
);

/**
 * @openapi
 * /cart/add:
 *   post:
 *     summary: Agrega un producto al carrito del usuario autenticado
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCartInput'
 *     responses:
 *       200:
 *         description: Producto agregado al carrito
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post("/cart/add", authMiddleware, addProductToCart);

export default router;
