import express from "express";
import { body, param } from "express-validator";
import {
  getMyWishlist,
  addProductToWishlist,
  removeProductFromWishlist,
  getWishlists,
  getWishlistByUser,
  deleteWishlist,
} from "../controllers/wishlistController.js";
import validate from "../middlewares/validation.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import isSelfOrAdmin from "../middlewares/isSelfOrAdminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

const wishlistIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Wishlist ID must be a valid MongoDB ObjectId"),
];

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const addProductValidation = [
  body("productId")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
];

const removeProductValidation = [
  param("productId")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
];

/**
 * @openapi
 * /wishlist:
 *   get:
 *     summary: Obtiene la lista de deseos del usuario autenticado
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de deseos del usuario
 *       401:
 *         description: No autenticado
 */
router.get("/wishlist", authMiddleware, getMyWishlist);

/**
 * @openapi
 * /wishlist:
 *   post:
 *     summary: Agrega un producto a la lista de deseos
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddWishlistInput'
 *     responses:
 *       200:
 *         description: Producto agregado a la lista de deseos
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post(
  "/wishlist",
  authMiddleware,
  addProductValidation,
  validate,
  addProductToWishlist,
);

/**
 * @openapi
 * /wishlist/products/{productId}:
 *   delete:
 *     summary: Elimina un producto de la lista de deseos
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto a remover
 *     responses:
 *       200:
 *         description: Producto removido de la lista de deseos
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 */
router.delete(
  "/wishlist/products/:productId",
  authMiddleware,
  removeProductValidation,
  validate,
  removeProductFromWishlist,
);

/**
 * @openapi
 * /wishlist/all:
 *   get:
 *     summary: Lista todas las listas de deseos (solo administradores)
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista completa de listas de deseos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere rol de administrador)
 */
router.get("/wishlist/all", authMiddleware, isAdmin, getWishlists);

/**
 * @openapi
 * /wishlist/user/{id}:
 *   get:
 *     summary: Obtiene la lista de deseos de un usuario específico
 *     tags:
 *       - Wishlist
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
 *         description: Lista de deseos del usuario
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (solo propio usuario o admin)
 */
router.get(
  "/wishlist/user/:id",
  authMiddleware,
  isSelfOrAdmin,
  userIdValidation,
  validate,
  getWishlistByUser,
);

/**
 * @openapi
 * /wishlist/{id}:
 *   delete:
 *     summary: Elimina una lista de deseos completa por su ID
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la lista de deseos
 *     responses:
 *       200:
 *         description: Lista de deseos eliminada
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Lista de deseos no encontrada
 */
router.delete(
  "/wishlist/:id",
  authMiddleware,
  wishlistIdValidation,
  validate,
  deleteWishlist,
);

export default router;
