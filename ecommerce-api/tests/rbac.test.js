import { describe, it } from "node:test";
import assert from "node:assert/strict";
import isAdmin from "../src/middlewares/isAdminMiddleware.js";
import isSelfOrAdmin from "../src/middlewares/isSelfOrAdminMiddleware.js";
import { mockRequest, mockResponse } from "./helpers.js";

describe("Seguridad: Control de Acceso por Roles (isAdminMiddleware)", () => {
  it("Frena petición sin usuario autenticado previo con 401", () => {
    const req = mockRequest({ user: undefined });
    const res = mockResponse();
    let nextCalled = false;

    isAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res._jsonData, { message: "Authentication is required" });
    assert.equal(nextCalled, false);
  });

  it("Frena intento de escalada de privilegios de usuario 'customer' a ruta admin con 403", () => {
    const req = mockRequest({ user: { userId: "user-1", role: "customer" } });
    const res = mockResponse();
    let nextCalled = false;

    isAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res._jsonData, { message: "Admin access required" });
    assert.equal(nextCalled, false);
  });

  it("Permite el paso a usuarios con rol legítimo de 'admin'", () => {
    const req = mockRequest({ user: { userId: "admin-1", role: "admin" } });
    const res = mockResponse();
    let nextCalled = false;

    isAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.headersSent, false);
  });
});

describe("Seguridad: Prevención de IDOR y Control de Propiedad (isSelfOrAdminMiddleware)", () => {
  it("Frena petición sin usuario autenticado previo con 401", () => {
    const req = mockRequest({ params: { id: "user-1" }, user: undefined });
    const res = mockResponse();
    let nextCalled = false;

    isSelfOrAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res._jsonData, { message: "Authentication is required" });
    assert.equal(nextCalled, false);
  });

  it("Frena ataque IDOR: usuario 'customer' intentando acceder o modificar datos de otro usuario con 403", () => {
    // El usuario atacante tiene userId="victima-1", pero en la ruta intenta manipular id="victima-2"
    const req = mockRequest({
      params: { id: "victima-2" },
      user: { userId: "atacante-1", role: "customer" },
    });
    const res = mockResponse();
    let nextCalled = false;

    isSelfOrAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res._jsonData, { message: "Access denied" });
    assert.equal(nextCalled, false);
  });

  it("Permite el paso cuando el usuario accede a su propio recurso (userId === params.id)", () => {
    const req = mockRequest({
      params: { id: "user-propio-123" },
      user: { userId: "user-propio-123", role: "customer" },
    });
    const res = mockResponse();
    let nextCalled = false;

    isSelfOrAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.headersSent, false);
  });

  it("Permite el paso cuando un administrador accede a recursos de cualquier usuario", () => {
    const req = mockRequest({
      params: { id: "usuario-cualquiera-456" },
      user: { userId: "admin-999", role: "admin" },
    });
    const res = mockResponse();
    let nextCalled = false;

    isSelfOrAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.headersSent, false);
  });
});

