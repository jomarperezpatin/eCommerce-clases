import express from "express";
import { register, login, refresh } from "../controllers/authController.js";

const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: El usuario ya existe o datos inválidos
 */
router.post("/register", register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Inicia sesión y obtiene tokens JWT
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Autenticación exitosa (retorna token y refreshToken)
 *       400:
 *         description: Credenciales inválidas o usuario no existe
 */
router.post("/login", login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Renueva el access token usando el refresh token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshInput'
 *     responses:
 *       200:
 *         description: Nuevo token generado correctamente
 *       401:
 *         description: Refresh token no proporcionado o inválido
 */
router.post("/refresh", refresh);

export default router;
