import { describe, it } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import authMiddleware from "../src/middlewares/authMiddleware.js";
import { mockRequest, mockResponse, createTestToken } from "./helpers.js";

describe("Seguridad: Middleware de Autenticación (authMiddleware)", () => {
  it("Frena petición sin encabezado Authorization con 401 Unauthorized", () => {
    const req = mockRequest({ headers: {} });
    const res = mockResponse();
    let nextCalled = false;

    authMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res._jsonData, { message: "Unauthorized" });
    assert.equal(nextCalled, false);
  });

  it("Frena petición con encabezado Authorization vacío o malformado", () => {
    const req = mockRequest({ headers: { authorization: "Bearer" } });
    const res = mockResponse();
    let nextCalled = false;

    authMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res._jsonData, { message: "Unauthorized" });
    assert.equal(nextCalled, false);
  });

  it("Frena petición con token manipulado / alterado por un atacante", () => {
    const token = createTestToken({ userId: "123", role: "customer" });
    // Modificamos un caracter de la firma
    const tamperedToken = token.slice(0, -5) + "XXXXX";
    const req = mockRequest({ headers: { authorization: `Bearer ${tamperedToken}` } });
    const res = mockResponse();
    let nextCalled = false;

    authMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res._jsonData, { message: "Invalid or expired token" });
    assert.equal(nextCalled, false);
  });

  it("Frena petición con token firmado con una clave secreta incorrecta", () => {
    const fakeToken = jwt.sign({ userId: "123", role: "admin" }, "clave_falsa_del_atacante");
    const req = mockRequest({ headers: { authorization: `Bearer ${fakeToken}` } });
    const res = mockResponse();
    let nextCalled = false;

    authMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res._jsonData, { message: "Invalid or expired token" });
    assert.equal(nextCalled, false);
  });

  it("Frena petición con token expirado", () => {
    // Token con tiempo de expiración en el pasado
    const expiredToken = jwt.sign(
      { userId: "123", role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "0s" }
    );
    const req = mockRequest({ headers: { authorization: `Bearer ${expiredToken}` } });
    const res = mockResponse();
    let nextCalled = false;

    authMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res._jsonData, { message: "Invalid or expired token" });
    assert.equal(nextCalled, false);
  });

  it("Permite el paso e inyecta req.user cuando el token es legítimo y vigente", () => {
    const payload = { userId: "user-abc-123", name: "Ana", role: "customer" };
    const validToken = createTestToken(payload);
    const req = mockRequest({ headers: { authorization: `Bearer ${validToken}` } });
    const res = mockResponse();
    let nextCalled = false;

    authMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.user.userId, payload.userId);
    assert.equal(req.user.name, payload.name);
    assert.equal(req.user.role, payload.role);
    assert.equal(res.headersSent, false);
  });
});

