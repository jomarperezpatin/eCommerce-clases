import jwt from "jsonwebtoken";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_key_123456789";
process.env.JWT_REFRESH_TOKEN = process.env.JWT_REFRESH_TOKEN || "test_jwt_refresh_secret_987654321";

/**
 * Crea un mock del objeto Request de Express
 */
export function mockRequest(options = {}) {
  return {
    headers: options.headers || {},
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    user: options.user || undefined,
    file: options.file || undefined,
    url: options.url || "/",
    method: options.method || "GET",
    ...options,
  };
}

/**
 * Crea un mock del objeto Response de Express
 */
export function mockResponse() {
  const res = {
    statusCode: 200,
    headersSent: false,
    _jsonData: null,
    _sentData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.headersSent = true;
      this._jsonData = data;
      return this;
    },
    send(data) {
      this.headersSent = true;
      this._sentData = data;
      return this;
    },
  };
  return res;
}

/**
 * Genera un token JWT de prueba firmado con la clave del entorno
 */
export function createTestToken(payload, secret = process.env.JWT_SECRET, options = { expiresIn: "1h" }) {
  return jwt.sign(payload, secret, options);
}

/**
 * Genera un refresh token de prueba firmado
 */
export function createTestRefreshToken(payload, secret = process.env.JWT_REFRESH_TOKEN, options = { expiresIn: "7d" }) {
  return jwt.sign(payload, secret, options);
}

