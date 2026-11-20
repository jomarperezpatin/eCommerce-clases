import { describe, it } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { refresh } from "../src/controllers/authController.js";
import { mockRequest, mockResponse } from "./helpers.js";

describe("Seguridad: Rotación y Renovación Segura de Tokens (authController.refresh)", () => {
  it("Frena petición de renovación sin refreshToken con 401", async () => {
    const req = mockRequest({ body: {} });
    const res = mockResponse();

    await refresh(req, res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res._jsonData, { message: "No se mando Refresh token" });
  });

  it("Frena petición con refreshToken falso, manipulado o alterado con 401", async () => {
    const req = mockRequest({ body: { refreshToken: "token_falso_adulterado.123.456" } });
    const res = mockResponse();

    await refresh(req, res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res._jsonData, { message: "Refresh Token Invalido" });
  });

  it("Frena petición con refreshToken firmado con clave secreta errónea con 401", async () => {
    const fakeToken = jwt.sign({ userId: "123" }, "clave_secreta_falsa");
    const req = mockRequest({ body: { refreshToken: fakeToken } });
    const res = mockResponse();

    await refresh(req, res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res._jsonData, { message: "Refresh Token Invalido" });
  });
});

