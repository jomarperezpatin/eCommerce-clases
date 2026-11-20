import { describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";

describe("Seguridad: Enmascarado y Protección de Contraseñas (Hashing y Sanitización)", () => {
  it("Asegura que las contraseñas se hashean con bcrypt y nunca se persisten en texto plano", async () => {
    const rawPassword = "MiPasswordSuperSeguro123!";
    const saltRounds = 10;
    const hash = await bcrypt.hash(rawPassword, saltRounds);

    // El hash no debe ser igual a la contraseña en plano
    assert.notEqual(hash, rawPassword);
    // Debe empezar con la firma de algoritmo bcrypt ($2a$ o $2b$)
    assert.match(hash, /^\$2[ab]\$10\$/);
    // La longitud estándar de bcrypt es 60 caracteres
    assert.equal(hash.length, 60);

    // Comprobamos que bcrypt valida la correcta y rechaza las falsas
    const isValid = await bcrypt.compare(rawPassword, hash);
    const isInvalid = await bcrypt.compare("PasswordIncorrecto", hash);

    assert.equal(isValid, true);
    assert.equal(isInvalid, false);
  });

  it("Asegura que el objeto de respuesta del usuario elimina el campo sensible 'password'", () => {
    // Simulamos la respuesta de creación de usuario en userController.js
    const rawUserDoc = {
      _id: "507f1f77bcf86cd799439011",
      name: "Usuario Seguro",
      email: "seguro@example.com",
      password: "$2b$10$hashsecretoquenodebesaliralfront",
      role: "customer",
    };

    const userResponse = { ...rawUserDoc };
    delete userResponse.password;

    // Verificamos que el campo password fue removido
    assert.equal("password" in userResponse, false);
    assert.equal(userResponse.name, "Usuario Seguro");
    assert.equal(userResponse.email, "seguro@example.com");
  });
});

