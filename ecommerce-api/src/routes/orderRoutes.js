import express from "express";
import { body, param } from "express-validator";
import {
  getOrders,
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const orderIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Order ID must be a valid MongoDB ObjectId"),
];

const createOrderValidation = [
  body("products")
    .notEmpty()
    .withMessage("Products array is required")
    .isArray({ min: 1 })
    .withMessage("Products must be a non-empty array"),
  body("products.*.productId")
    .notEmpty()
    .withMessage("Each product item must include productId")
    .isMongoId()
    .withMessage("Each productId must be a valid MongoDB ObjectId"),
  body("products.*.quantity")
    .notEmpty()
    .withMessage("Each product item must include quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
  body("address")
    .notEmpty()
    .withMessage("Address is required")
    .isMongoId()
    .withMessage("Address must be a valid MongoDB ObjectId"),
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isMongoId()
    .withMessage("Payment method must be a valid MongoDB ObjectId"),
];

const updateOrderStatusValidation = [
  param("id")
    .isMongoId()
    .withMessage("Order ID must be a valid MongoDB ObjectId"),
  body("status")
    .optional()
    .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid order status"),
  body("paymentStatus")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded"])
    .withMessage("Invalid payment status"),
];

/**
 * @openapi
 * /orders:
 *   get:
 *     summary: Lista todas las órdenes del sistema (solo administradores)
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas las órdenes
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere rol de administrador)
 */
router.get("/orders", authMiddleware, isAdmin, getOrders);

/**
 * @openapi
 * /orders/my-orders:
 *   get:
 *     summary: Lista las órdenes del usuario autenticado
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de órdenes del usuario
 *       401:
 *         description: No autenticado
 */
router.get("/orders/my-orders", authMiddleware, getMyOrders);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     summary: Obtiene el detalle de una orden por su ID
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la orden (ObjectId)
 *     responses:
 *       200:
 *         description: Detalle de la orden
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Orden no encontrada
 */
router.get(
  "/orders/:id",
  authMiddleware,
  orderIdValidation,
  validate,
  getOrderById,
);

/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Crea una nueva orden de compra
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderInput'
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *       400:
 *         description: Datos inválidos o stock insuficiente
 *       401:
 *         description: No autenticado
 */
router.post(
  "/orders",
  authMiddleware,
  createOrderValidation,
  validate,
  createOrder,
);

/**
 * @openapi
 * /orders/{id}:
 *   put:
 *     summary: Actualiza el estado de una orden (solo administradores)
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la orden
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderStatusInput'
 *     responses:
 *       200:
 *         description: Estado de la orden actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere rol de administrador)
 *       404:
 *         description: Orden no encontrada
 */
router.put(
  "/orders/:id",
  authMiddleware,
  isAdmin,
  updateOrderStatusValidation,
  validate,
  updateOrderStatus,
);

export default router;
