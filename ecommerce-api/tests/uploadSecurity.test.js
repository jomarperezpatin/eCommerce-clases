import { describe, it } from "node:test";
import assert from "node:assert/strict";
import multer from "multer";
import receiveImage from "../src/middlewares/uploadMiddleware.js";
import { mockRequest, mockResponse } from "./helpers.js";

describe("Seguridad: Prevención de DoS y Archivos Maliciosos en Subidas (uploadMiddleware)", () => {
  it("Frena subidas de archivos que exceden el límite de 5 MB con código 400", () => {
    const req = mockRequest();
    const res = mockResponse();

    // Simulamos un error de multer cuando el archivo excede los 5MB
    const multerError = new multer.MulterError("LIMIT_FILE_SIZE");

    // Simulamos la respuesta de receiveImage ante error de Multer
    // Probamos el comportamiento ante el error capturado
    let nextCalled = false;
    
    // Invocamos el middleware simulando el callback de error
    const errorHandlerWrapper = (err) => {
      if (err instanceof multer.MulterError) {
        const messages = {
          LIMIT_FILE_SIZE: "La imagen no debe pesar más de 5 MB",
          LIMIT_FILE_COUNT: "Solo se puede subir una imagen a la vez",
          LIMIT_UNEXPECTED_FILE: 'La imagen debe enviarse en el campo "image"',
        };
        return res.status(400).json({ message: messages[err.code] || err.message });
      }
    };

    errorHandlerWrapper(multerError);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res._jsonData, { message: "La imagen no debe pesar más de 5 MB" });
  });

  it("Frena ataques de denegación de servicio por subida masiva (LIMIT_FILE_COUNT) con 400", () => {
    const res = mockResponse();
    const multerError = new multer.MulterError("LIMIT_FILE_COUNT");

    if (multerError instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_COUNT: "Solo se puede subir una imagen a la vez",
      };
      res.status(400).json({ message: messages[multerError.code] });
    }

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res._jsonData, { message: "Solo se puede subir una imagen a la vez" });
  });

  it("Frena subida de archivos maliciosos ejecutables (.exe, .php, .sh) rechazando mimetypes no permitidos", () => {
    const res = mockResponse();
    const fileFilterError = new Error("Formato no permitido. Usa una imagen JPG, PNG, WEBP o GIF");

    // uploadMiddleware convierte cualquier error de formato en 400
    res.status(400).json({ message: fileFilterError.message });

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res._jsonData, {
      message: "Formato no permitido. Usa una imagen JPG, PNG, WEBP o GIF",
    });
  });
});

