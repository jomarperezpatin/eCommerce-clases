import express from "express";
import { body, param } from "express-validator";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const categoryIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Category ID must be a valid MongoDB ObjectId"),
];

const createCategoryValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("parentCategory")
    .optional()
    .isMongoId()
    .withMessage("Parent category must be a valid MongoDB ObjectId"),
];

const updateCategoryValidation = [
  param("id")
    .isMongoId()
    .withMessage("Category ID must be a valid MongoDB ObjectId"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("description")
    .optional()
    .notEmpty()
    .withMessage("Description cannot be empty"),
  body("parentCategory")
    .optional()
    .isMongoId()
    .withMessage("Parent category must be a valid MongoDB ObjectId"),
];

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: Lista todas las categorías
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: Un arreglo de categorías
 */
router.get("/categories", getCategories);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     summary: Obtiene una categoría por su ID
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría (ObjectId de MongoDB)
 *     responses:
 *       200:
 *         description: Detalle de la categoría
 *       400:
 *         description: ID de categoría inválido
 *       404:
 *         description: Categoría no encontrada
 */
router.get("/categories/:id", categoryIdValidation, validate, getCategoryById);

/**
 * @openapi
 * /categories:
 *   post:
 *     summary: Crea una nueva categoría (solo administradores)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere rol de administrador)
 */
router.post(
  "/categories",
  authMiddleware,
  isAdmin,
  createCategoryValidation,
  validate,
  createCategory,
);

/**
 * @openapi
 * /categories/{id}:
 *   put:
 *     summary: Actualiza una categoría existente (solo administradores)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere rol de administrador)
 *       404:
 *         description: Categoría no encontrada
 */
router.put(
  "/categories/:id",
  authMiddleware,
  isAdmin,
  updateCategoryValidation,
  validate,
  updateCategory,
);

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     summary: Elimina una categoría por su ID (solo administradores)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría a eliminar
 *     responses:
 *       204:
 *         description: Categoría eliminada exitosamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere rol de administrador)
 *       404:
 *         description: Categoría no encontrada
 */
router.delete(
  "/categories/:id",
  authMiddleware,
  isAdmin,
  categoryIdValidation,
  validate,
  deleteCategory,
);

export default router;
