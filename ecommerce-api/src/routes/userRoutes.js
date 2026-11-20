import express from "express";
import { body, param } from "express-validator";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import validate from "../middlewares/validation.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import isSelfOrAdmin from "../middlewares/isSelfOrAdminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const createUserValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("A valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["customer", "admin"])
    .withMessage("Role must be customer or admin"),
];

const updateUserValidation = [
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("email").optional().isEmail().withMessage("A valid email is required"),
  body("phone")
    .optional({ values: "falsy" })
    .matches(/^\d{10}$/)
    .withMessage("Phone must be 10 digits"),
  body("role")
    .optional()
    .isIn(["customer", "admin"])
    .withMessage("Role must be customer or admin"),
];

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Lista todos los usuarios registrados (solo administradores)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere rol de administrador)
 */
router.get("/users", authMiddleware, isAdmin, getUsers);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Obtiene el perfil de un usuario por su ID
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario (ObjectId)
 *     responses:
 *       200:
 *         description: Perfil del usuario encontrado
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (solo propio usuario o admin)
 *       404:
 *         description: Usuario no encontrado
 */
router.get(
  "/users/:id",
  authMiddleware,
  isSelfOrAdmin,
  userIdValidation,
  validate,
  getUserById,
);

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Crea un nuevo usuario directamente (solo administradores)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Datos inválidos o email ya registrado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere rol de administrador)
 */
router.post(
  "/users",
  authMiddleware,
  isAdmin,
  createUserValidation,
  validate,
  createUser,
);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     summary: Actualiza los datos de un usuario
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (solo propio usuario o admin)
 *       404:
 *         description: Usuario no encontrado
 */
router.put(
  "/users/:id",
  authMiddleware,
  isSelfOrAdmin,
  [...userIdValidation, ...updateUserValidation],
  validate,
  updateUser,
);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: Elimina un usuario por su ID (solo administradores)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario a eliminar
 *     responses:
 *       204:
 *         description: Usuario eliminado
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere rol de administrador)
 *       404:
 *         description: Usuario no encontrado
 */
router.delete(
  "/users/:id",
  authMiddleware,
  isAdmin,
  userIdValidation,
  validate,
  deleteUser,
);

export default router;
