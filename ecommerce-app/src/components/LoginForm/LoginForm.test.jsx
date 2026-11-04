import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "./LoginForm";
import { login } from "../../utils/auth";

// Mock virtual de react-router-dom para compatibilidad con Jest 27
const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ to, children, ...rest }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

// Mock de la función login de auth
jest.mock("../../utils/auth", () => ({
  login: jest.fn(),
}));

describe("LoginForm Component (Pruebas de Frontend)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Mock seguro de window.location.reload para entorno JSDOM
    try {
      window.location.reload = jest.fn();
    } catch {
      Object.defineProperty(window, "location", {
        writable: true,
        configurable: true,
        value: { ...window.location, reload: jest.fn() },
      });
    }
  });

  test("1. Aparecen los campos de email, contraseña y el botón de inicio de sesión", () => {
    render(<LoginForm />);

    // Título del formulario
    expect(
      screen.getByRole("heading", { name: /iniciar sesión/i, level: 2 })
    ).toBeInTheDocument();

    // Campo de Email
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("placeholder", "Ingresa tu email");
    expect(emailInput).toBeRequired();

    // Campo de Contraseña
    const passwordInput = screen.getByLabelText(/contraseña/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute("placeholder", "Ingresa tu contraseña");
    expect(passwordInput).toBeRequired();

    // Botón de submit
    const submitButton = screen.getByRole("button", { name: /iniciar sesión/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute("type", "submit");
    expect(submitButton).toBeEnabled();

    // Enlace para volver al inicio
    const backLink = screen.getByRole("link", { name: /volver al inicio/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");

    // No debe haber mensajes de error al renderizar
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("2. Con los datos correctos, el usuario entra (llama a login, redirige a '/' y recarga sesión)", async () => {
    const user = userEvent.setup();
    login.mockResolvedValueOnce({ success: true });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole("button", { name: /iniciar sesión/i });

    // El usuario llena sus credenciales correctas
    await user.type(emailInput, "usuario.valido@correo.com");
    await user.type(passwordInput, "passwordSeguro123");

    expect(emailInput).toHaveValue("usuario.valido@correo.com");
    expect(passwordInput).toHaveValue("passwordSeguro123");

    // Envía el formulario
    await user.click(submitButton);

    // Mientras procesa (debido al delay artificial de 800ms), muestra estado de carga
    expect(submitButton).toHaveTextContent("Iniciando sesión...");
    expect(submitButton).toBeDisabled();

    // Espera a que se complete el flujo de autenticación exitoso
    await waitFor(
      () => {
        expect(login).toHaveBeenCalledTimes(1);
        expect(login).toHaveBeenCalledWith(
          "usuario.valido@correo.com",
          "passwordSeguro123"
        );
        expect(mockNavigate).toHaveBeenCalledWith("/");
        expect(window.location.reload).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );

    // No debe existir mensaje de error visible
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  test("3. Con datos incorrectos, se muestra un error en pantalla y NO entra", async () => {
    const user = userEvent.setup();
    const errorMensaje = "Credenciales incorrectas. Verifica tu email y contraseña.";
    login.mockResolvedValueOnce({ success: false, error: errorMensaje });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole("button", { name: /iniciar sesión/i });

    // El usuario ingresa credenciales incorrectas
    await user.type(emailInput, "usuario.incorrecto@correo.com");
    await user.type(passwordInput, "claveErronea");

    // Envía el formulario
    await user.click(submitButton);

    // Se muestra estado de carga temporal
    expect(submitButton).toHaveTextContent("Iniciando sesión...");
    expect(submitButton).toBeDisabled();

    // Espera que aparezca el mensaje de error en la UI
    const errorElement = await screen.findByText(
      errorMensaje,
      {},
      { timeout: 3000 }
    );
    expect(errorElement).toBeInTheDocument();

    // Verifica que NO entra (no navega ni recarga la página)
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();

    // El botón vuelve a habilitarse para permitir un nuevo intento
    expect(submitButton).toHaveTextContent("Iniciar Sesión");
    expect(submitButton).toBeEnabled();
  });

  test("4. Ante un error inesperado del servidor, muestra el mensaje de fallo sin navegar", async () => {
    const user = userEvent.setup();
    const serverError = "Error al iniciar sesión";
    login.mockResolvedValueOnce({ success: false, error: serverError });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole("button", { name: /iniciar sesión/i });

    await user.type(emailInput, "servidor.caido@correo.com");
    await user.type(passwordInput, "cualquierPassword");
    await user.click(submitButton);

    // Debe mostrar el mensaje de error
    expect(
      await screen.findByText(serverError, {}, { timeout: 3000 })
    ).toBeInTheDocument();

    // No debe navegar ni recargar
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();
    expect(submitButton).toBeEnabled();
  });
});

