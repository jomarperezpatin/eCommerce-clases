import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { body, param } from "express-validator";
import validate from "../src/middlewares/validation.js";
import { mockRequest, mockResponse } from "./helpers.js";

describe("Seguridad: Validación y Sanitización de Entradas (validation.js)", () => {
  it("Frena datos con formato inválido o inyecciones con código 422 Unprocessable Entity", async () => {
    // Simulamos validación de MongoDB ObjectId como se usa en las rutas
    const validations = [
      param("id").isMongoId().withMessage("Product ID must be a valid MongoDB ObjectId"),
    ];

    // Payload de ataque con ID malicioso (SQL/NoSQL injection string en vez de ObjectId)
    const req = mockRequest({
      params: { id: "inyeccion-maliciosa-no-objectid" },
    });
    const res = mockResponse();
    let nextCalled = false;

    for (const validation of validations) {
      await validation.run(req);
    }

    validate(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 422);
    assert.equal(nextCalled, false);
    assert.equal(Array.isArray(res._jsonData.errors), true);
    assert.equal(res._jsonData.errors.length > 0, true);
    assert.equal(res._jsonData.errors[0].msg, "Product ID must be a valid MongoDB ObjectId");
  });

  it("Frena peticiones con campos obligatorios vacíos o números negativos con 422", async () => {
    const validations = [
      body("name").notEmpty().withMessage("Name is required"),
      body("price").notEmpty().isFloat({ min: 0 }).withMessage("Price must be a positive number"),
    ];

    // Payload atacante intentando enviar precio negativo
    const req = mockRequest({
      body: { name: "", price: -50 },
    });
    const res = mockResponse();
    let nextCalled = false;

    for (const validation of validations) {
      await validation.run(req);
    }

    validate(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 422);
    assert.equal(nextCalled, false);
    assert.equal(res._jsonData.errors.length >= 2, true);
  });

  it("Permite el paso limpio (next()) cuando todas las entradas son legítimas", async () => {
    const validations = [
      param("id").isMongoId().withMessage("Invalid ID"),
      body("name").notEmpty().withMessage("Name is required"),
    ];

    const req = mockRequest({
      params: { id: "507f1f77bcf86cd799439011" }, // ObjectId válido de 24 chars hex
      body: { name: "Producto Legítimo" },
    });
    const res = mockResponse();
    let nextCalled = false;

    for (const validation of validations) {
      await validation.run(req);
    }

    validate(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.headersSent, false);
  });
});

