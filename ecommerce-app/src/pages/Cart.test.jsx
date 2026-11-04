import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Cart from "./Cart";
import { CartProvider, useCart } from "../context/CartContext";

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

// Mock de productos de prueba
const mockProductA = {
  _id: "prod-A",
  name: "Mouse Ergonómico",
  price: 500,
  stock: 10,
  imagesUrl: ["/img/products/mouse.jpg"],
};

const mockProductB = {
  _id: "prod-B",
  name: "Teclado Mecánico",
  price: 1200,
  stock: 15,
  imagesUrl: ["/img/products/teclado.jpg"],
};

// Mock de servicios para evitar llamadas de red durante syncStock y persistencia
jest.mock("../services/productsService", () => ({
  getProductById: jest.fn((id) => {
    const found = [mockProductA, mockProductB].find((p) => p._id === id);
    return Promise.resolve(found || { _id: id, stock: 10 });
  }),
}));

jest.mock("../services/cartService", () => ({
  getCart: jest.fn().mockResolvedValue({ cartId: "cart-test", items: [] }),
  replaceCart: jest.fn().mockResolvedValue({}),
}));

jest.mock("../services/apiClient", () => ({
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

// Arnés de prueba para interactuar con el carrito y renderizar la vista de Cart
function CartTestHarness() {
  const { addToCart } = useCart();

  return (
    <div>
      <div data-testid="catalog-actions">
        <button
          type="button"
          onClick={() => addToCart(mockProductA, 1)}
        >
          Agregar Mouse Ergonómico
        </button>
        <button
          type="button"
          onClick={() => addToCart(mockProductB, 1)}
        >
          Agregar Teclado Mecánico
        </button>
      </div>
      <Cart />
    </div>
  );
}

function CartTestApp() {
  return (
    <CartProvider>
      <CartTestHarness />
    </CartProvider>
  );
}

describe("Cart Component & Flow (Pruebas del Carrito)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("1. Agregar un producto: el carrito muestra el producto y el total refleja su precio exacto", async () => {
    const user = userEvent.setup();
    render(<CartTestApp />);

    // Inicialmente el carrito debe estar vacío
    expect(screen.getByText("Tu carrito está vacío")).toBeInTheDocument();

    // El usuario agrega el Producto A ($500.00)
    const addMouseBtn = screen.getByRole("button", {
      name: /agregar mouse ergonómico/i,
    });
    await user.click(addMouseBtn);

    // El mensaje de vacío desaparece y aparece la fila del producto
    expect(
      await screen.findByRole("heading", {
        name: "Mouse Ergonómico",
        level: 3,
      })
    ).toBeInTheDocument();
    expect(screen.queryByText("Tu carrito está vacío")).not.toBeInTheDocument();

    // La cantidad en la fila del producto es 1
    const cartItem = screen
      .getByRole("heading", { name: "Mouse Ergonómico", level: 3 })
      .closest(".cart-item");
    expect(within(cartItem).getByText("1")).toBeInTheDocument();

    // El contador de artículos en el encabezado muestra '1 artículo'
    const header = screen
      .getByRole("heading", { name: "Carrito de Compras", level: 1 })
      .closest(".cart-header");
    expect(within(header).getByText("1 artículo")).toBeInTheDocument();

    // El total a pagar refleja exactamente el precio del producto ($500.00)
    const summary = screen.getByText("Total a pagar").closest(".cart-summary");
    expect(
      within(summary).getByRole("heading", { name: "$500.00", level: 2 })
    ).toBeInTheDocument();
  });

  test("2. Agrega el MISMO producto 2 veces: se acumula en una sola línea y actualiza la cantidad y el total", async () => {
    const user = userEvent.setup();
    render(<CartTestApp />);

    const addMouseBtn = screen.getByRole("button", {
      name: /agregar mouse ergonómico/i,
    });

    // Primera adición de Producto A
    await user.click(addMouseBtn);
    expect(
      await screen.findByRole("heading", {
        name: "Mouse Ergonómico",
        level: 3,
      })
    ).toBeInTheDocument();

    // Segunda adición del MISMO Producto A
    await user.click(addMouseBtn);

    // Debe existir EXACTAMENTE UNA sola fila para Mouse Ergonómico (no se duplica la tarjeta)
    const itemHeadings = await screen.findAllByRole("heading", {
      name: "Mouse Ergonómico",
      level: 3,
    });
    expect(itemHeadings).toHaveLength(1);

    // La cantidad acumulada en esa línea debe ser 2
    const cartItem = itemHeadings[0].closest(".cart-item");
    await waitFor(() => {
      expect(within(cartItem).getByText("2")).toBeInTheDocument();
    });

    // El contador de artículos en el encabezado principal se actualiza a '2 artículos'
    const header = screen
      .getByRole("heading", { name: "Carrito de Compras", level: 1 })
      .closest(".cart-header");
    expect(within(header).getByText("2 artículos")).toBeInTheDocument();

    // El total a pagar se duplica a $1000.00 ($500 * 2)
    const summary = screen.getByText("Total a pagar").closest(".cart-summary");
    expect(
      within(summary).getByRole("heading", { name: "$1000.00", level: 2 })
    ).toBeInTheDocument();
  });

  test("3. Agrega productos DISTINTOS: se muestran en líneas separadas y el total los suma correctamente", async () => {
    const user = userEvent.setup();
    render(<CartTestApp />);

    const addMouseBtn = screen.getByRole("button", {
      name: /agregar mouse ergonómico/i,
    });
    const addKeyboardBtn = screen.getByRole("button", {
      name: /agregar teclado mecánico/i,
    });

    // Agrega 2 unidades del Producto A ($500.00 c/u -> $1000.00)
    await user.click(addMouseBtn);
    expect(
      await screen.findByRole("heading", {
        name: "Mouse Ergonómico",
        level: 3,
      })
    ).toBeInTheDocument();

    await user.click(addMouseBtn);

    const mouseHeading = await screen.findByRole("heading", {
      name: "Mouse Ergonómico",
      level: 3,
    });
    const mouseItem = mouseHeading.closest(".cart-item");
    await waitFor(() => {
      expect(within(mouseItem).getByText("2")).toBeInTheDocument();
    });

    // Agrega 1 unidad de un producto DISTINTO: Producto B ($1200.00)
    await user.click(addKeyboardBtn);

    const keyboardHeading = await screen.findByRole("heading", {
      name: "Teclado Mecánico",
      level: 3,
    });
    expect(keyboardHeading).toBeInTheDocument();

    const keyboardItem = keyboardHeading.closest(".cart-item");
    expect(within(keyboardItem).getByText("1")).toBeInTheDocument();

    // Contador global en el encabezado suma 3 artículos (2 mouses + 1 teclado)
    const header = screen
      .getByRole("heading", { name: "Carrito de Compras", level: 1 })
      .closest(".cart-header");
    await waitFor(() => {
      expect(within(header).getByText("3 artículos")).toBeInTheDocument();
    });

    // Subtotal de la línea de Mouse: $1000.00
    expect(within(mouseItem).getByText("$1000.00")).toBeInTheDocument();

    // Subtotal de la línea de Teclado: $1200.00 (verificado en el elemento cart-item-total)
    const keyboardTotal = keyboardItem.querySelector(".cart-item-total");
    expect(keyboardTotal).toHaveTextContent("$1200.00");

    // El Total a pagar general suma ambos productos: $1000 + $1200 = $2200.00
    const summary = screen.getByText("Total a pagar").closest(".cart-summary");
    expect(
      within(summary).getByRole("heading", { name: "$2200.00", level: 2 })
    ).toBeInTheDocument();
  });

  test("4. Elimina un producto: desaparece de la lista y el total general se recalcula automáticamente", async () => {
    const user = userEvent.setup();
    render(<CartTestApp />);

    const addMouseBtn = screen.getByRole("button", {
      name: /agregar mouse ergonómico/i,
    });
    const addKeyboardBtn = screen.getByRole("button", {
      name: /agregar teclado mecánico/i,
    });

    // Agrega Producto A ($500) y Producto B ($1200) -> Total $1700.00
    await user.click(addMouseBtn);
    expect(
      await screen.findByRole("heading", {
        name: "Mouse Ergonómico",
        level: 3,
      })
    ).toBeInTheDocument();

    await user.click(addKeyboardBtn);
    expect(
      await screen.findByRole("heading", {
        name: "Teclado Mecánico",
        level: 3,
      })
    ).toBeInTheDocument();

    const summary = screen.getByText("Total a pagar").closest(".cart-summary");
    expect(
      within(summary).getByRole("heading", { name: "$1700.00", level: 2 })
    ).toBeInTheDocument();

    // Localiza los botones de eliminar (icono de basura con título 'Eliminar artículo')
    const deleteButtons = screen.getAllByRole("button", {
      name: /eliminar artículo/i,
    });
    expect(deleteButtons).toHaveLength(2);

    // Elimina el Producto A (primer botón)
    await user.click(deleteButtons[0]);

    // El Producto A ya no debe estar en el DOM
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Mouse Ergonómico", level: 3 })
      ).not.toBeInTheDocument();
    });

    // El Producto B permanece visible
    expect(
      screen.getByRole("heading", { name: "Teclado Mecánico", level: 3 })
    ).toBeInTheDocument();

    // El contador de artículos se reduce a '1 artículo'
    const header = screen
      .getByRole("heading", { name: "Carrito de Compras", level: 1 })
      .closest(".cart-header");
    expect(within(header).getByText("1 artículo")).toBeInTheDocument();

    // El total general se recalcula y ahora sólo refleja el Producto B ($1200.00)
    expect(
      within(summary).getByRole("heading", { name: "$1200.00", level: 2 })
    ).toBeInTheDocument();
    expect(within(summary).queryByText("$1700.00")).not.toBeInTheDocument();

    // Si se elimina también el Producto B restante
    const deleteLastButton = screen.getByRole("button", {
      name: /eliminar artículo/i,
    });
    await user.click(deleteLastButton);

    // El carrito vuelve al estado vacío
    expect(await screen.findByText("Tu carrito está vacío")).toBeInTheDocument();
  });
});
