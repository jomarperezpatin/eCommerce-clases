import { describe, it } from "node:test";
import assert from "node:assert/strict";
import errorHandler from "../src/middlewares/errorHandler.js";
import { mockRequest, mockResponse } from "./helpers.js";

describe("Seguridad: Prevención de Fuga de Información Técnica (errorHandler)", () => {
  it("Frena fuga de stack traces o detalles internos de la base de datos ante errores no controlados (500)", () => {
    // Simulamos un error interno crítico del sistema (ej. fallo de base de datos con paths internos)
    const criticalError = new Error("MongoServerError: Authentication failed at /var/app/internal/db.js:45");
    criticalError.stack = "Error: MongoServerError at Object.<anonymous> (/var/app/internal/db.js:45:10)";

    const req = mockRequest({ url: "/api/products", method: "GET" });
    const res = mockResponse();

    errorHandler(criticalError, req, res, () => {});

    // Debe responder 500
    assert.equal(res.statusCode, 500);
    // El payload hacia el cliente debe ser genérico y seguro, NUNCA debe contener el stack trace
    assert.deepEqual(res._jsonData, {
      status: "error",
      message: "Internal Server Error",
    });
    // Verificamos que ningún detalle técnico interno se expuso en la respuesta
    assert.equal(JSON.stringify(res._jsonData).includes("MongoServerError"), false);
    assert.equal(JSON.stringify(res._jsonData).includes("/var/app/internal"), false);
  });
});

