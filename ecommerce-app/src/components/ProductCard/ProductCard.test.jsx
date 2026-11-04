import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider } from "../../context/CartContext";
import { WishlistProvider } from "../../context/WishlistContext";
import ProductCard from "./ProductCard";

// Mock virtual de react-router-dom para compatibilidad entre Jest 27 (Create React App) y React Router v7
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
    MemoryRouter: ({ children }) => <div>{children}</div>,
    Routes: ({ children }) => <div>{children}</div>,
    Route: ({ element }) => <div>{element}</div>,
  }),
  { virtual: true }
);

// Mock del cliente API base para aislar completamente las pruebas de red y evitar llamadas Axios
jest.mock("../../services/apiClient", () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

// Mock de servicios HTTP para que los providers operen en entorno aislado sin llamadas de red
jest.mock("../../services/cartService", () => ({
  getCart: jest.fn().mockResolvedValue({ cartId: "cart-test", items: [] }),
  replaceCart: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../services/wishlistService", () => ({
  getWishlist: jest.fn().mockResolvedValue([]),
  addToWishlist: jest.fn().mockResolvedValue([]),
  removeFromWishlist: jest.fn().mockResolvedValue([]),
}));

const mockProduct = {
  _id: "prod-101",
  name: "Audífonos Inalámbricos Pro",
  price: 2499,
  stock: 12,
  imagesUrl: ["/img/products/headphones.jpg"],
  description: "Audífonos con cancelación activa de ruido.",
};

function renderProductCard(props = {}) {
  const product = props.product !== undefined ? props.product : mockProduct;

  return render(
    <CartProvider>
      <WishlistProvider>
        <ProductCard {...props} product={product} />
      </WishlistProvider>
    </CartProvider>
  );
}

describe("ProductCard Component", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("1. Renderiza correctamente los datos visibles del producto (nombre, precio, badge y enlaces)", () => {
    renderProductCard();

    // Nombre y precio
    expect(screen.getByText("Audífonos Inalámbricos Pro")).toBeInTheDocument();
    expect(screen.getByText("$2499")).toBeInTheDocument();

    // Descripción visible no truncada (longitud <= 60 caracteres)
    expect(
      screen.getByText("Audífonos con cancelación activa de ruido.")
    ).toBeInTheDocument();

    // Badge de stock disponible
    expect(screen.getByText("En stock")).toBeInTheDocument();

    // Botón de compra visible y activo
    const addToCartBtn = screen.getByRole("button", { name: /agregar al carrito/i });
    expect(addToCartBtn).toBeInTheDocument();
    expect(addToCartBtn).toBeEnabled();

    // Imagen con atributo alt correspondiente
    const img = screen.getByAltText("Audífonos Inalámbricos Pro");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/img/products/headphones.jpg");

    // Enlace al detalle del producto
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/product/prod-101")).toBe(true);
  });

  test("2. Muestra estado 'Agotado' y deshabilita el botón cuando el stock es 0", () => {
    renderProductCard({
      product: {
        ...mockProduct,
        stock: 0,
      },
    });

    // Tanto el badge como el botón muestran el texto 'Agotado'
    const agotadoLabels = screen.getAllByText("Agotado");
    expect(agotadoLabels.length).toBe(2);

    // El botón debe reflejar el agotamiento y estar deshabilitado
    const actionBtn = screen.getByRole("button", { name: /agotado/i });
    expect(actionBtn).toBeInTheDocument();
    expect(actionBtn).toBeDisabled();
  });

  test("3. Muestra mensaje de guardia cuando no se proporciona producto (product = null)", () => {
    renderProductCard({ product: null });

    // Mensaje de producto no disponible
    expect(screen.getByText("Producto no disponible")).toBeInTheDocument();

    // No debe existir botón de agregar al carrito
    expect(screen.queryByRole("button", { name: /agregar al carrito/i })).not.toBeInTheDocument();
  });

  test("4. Muestra badge de descuento cuando el producto incluye 'discount > 0'", () => {
    renderProductCard({
      product: {
        ...mockProduct,
        discount: 20,
      },
    });

    // Badge de descuento
    expect(screen.getByText("-20%")).toBeInTheDocument();
  });

  test("5. Redirige a /login al pulsar el botón de favoritos si el usuario no está autenticado", async () => {
    const user = userEvent.setup();
    renderProductCard();

    // Usuario sin sesión en localStorage
    expect(localStorage.getItem("authToken")).toBeNull();

    const wishlistBtn = screen.getByRole("button", { name: /agregar a favoritos/i });
    await user.click(wishlistBtn);

    // Debe invocar navigate("/login")
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  test("6. Agrega a favoritos y actualiza accesibilidad (aria-pressed) cuando el usuario tiene sesión activa", async () => {
    const user = userEvent.setup();

    // Simula sesión activa configurando el token en localStorage
    localStorage.setItem("authToken", "mock-auth-token");

    renderProductCard();

    const wishlistBtn = screen.getByRole("button", { name: /agregar a favoritos/i });
    expect(wishlistBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(wishlistBtn);

    // Al estar autenticado, se alterna a favorito
    expect(wishlistBtn).toHaveAttribute("aria-pressed", "true");
    expect(wishlistBtn).toHaveAttribute("aria-label", "Quitar de favoritos");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("7. Muestra mensaje de inventario bajo singular ('¡Queda 1!') y plural ('¡Quedan 3!')", () => {
    const { unmount } = renderProductCard({
      product: {
        ...mockProduct,
        stock: 1,
      },
    });

    expect(screen.getByText("¡Queda 1!")).toBeInTheDocument();

    unmount();

    renderProductCard({
      product: {
        ...mockProduct,
        stock: 3,
      },
    });

    expect(screen.getByText("¡Quedan 3!")).toBeInTheDocument();
  });

  test("8. Trunca descripciones largas mayores a 60 caracteres agregando puntos suspensivos", () => {
    renderProductCard({
      product: {
        ...mockProduct,
        description: "Esta es una descripción deliberadamente larga para validar el truncamiento del componente en la tarjeta.",
      },
    });

    const expectedText = "Esta es una descripción deliberadamente larga para validar e...";
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });
});
