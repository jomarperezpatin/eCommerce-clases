import express from "express";
import { uploadImage } from "../controllers/uploadController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import receiveImage from "../middlewares/uploadMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /upload:
 *   post:
 *     summary: Sube una imagen a Cloudinary (solo administradores)
 *     tags:
 *       - Upload
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen (JPG, PNG, WEBP o GIF)
 *     responses:
 *       201:
 *         description: Imagen subida exitosamente a Cloudinary
 *       400:
 *         description: No se envió ninguna imagen o formato no permitido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere rol de administrador)
 */
router.post("/upload", authMiddleware, isAdmin, receiveImage, uploadImage);

export default router;
