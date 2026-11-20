import express from "express";
import { body, param } from "express-validator";
import {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

const addressIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Address ID must be a valid MongoDB ObjectId"),
];

const createAddressValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("address").notEmpty().withMessage("Address is required"),
];

const updateAddressValidation = [
  param("id")
    .isMongoId()
    .withMessage("Address ID must be a valid MongoDB ObjectId"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("address")
    .optional()
    .notEmpty()
    .withMessage("Address cannot be empty"),
];

/**
 * @openapi
 * /addresses:
 *   get:
 *     summary: Lista las direcciones guardadas del usuario autenticado
 *     tags:
 *       - Addresses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de direcciones del usuario
 *       401:
 *         description: No autenticado
 */
router.get("/addresses", authMiddleware, getUserAddresses);

/**
 * @openapi
 * /addresses/{id}:
 *   get:
 *     summary: Obtiene una dirección por su ID
 *     tags:
 *       - Addresses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la dirección (ObjectId)
 *     responses:
 *       200:
 *         description: Detalle de la dirección
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Dirección no encontrada
 */
router.get(
  "/addresses/:id",
  authMiddleware,
  addressIdValidation,
  validate,
  getAddressById,
);

/**
 * @openapi
 * /addresses:
 *   post:
 *     summary: Registra una nueva dirección para el usuario
 *     tags:
 *       - Addresses
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressInput'
 *     responses:
 *       201:
 *         description: Dirección creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post(
  "/addresses",
  authMiddleware,
  createAddressValidation,
  validate,
  createAddress,
);

/**
 * @openapi
 * /addresses/{id}:
 *   put:
 *     summary: Actualiza una dirección existente
 *     tags:
 *       - Addresses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la dirección
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressInput'
 *     responses:
 *       200:
 *         description: Dirección actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Dirección no encontrada
 */
router.put(
  "/addresses/:id",
  authMiddleware,
  updateAddressValidation,
  validate,
  updateAddress,
);

/**
 * @openapi
 * /addresses/{id}:
 *   delete:
 *     summary: Elimina una dirección
 *     tags:
 *       - Addresses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la dirección a eliminar
 *     responses:
 *       200:
 *         description: Dirección eliminada exitosamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Dirección no encontrada
 */
router.delete(
  "/addresses/:id",
  authMiddleware,
  addressIdValidation,
  validate,
  deleteAddress,
);

export default router;
