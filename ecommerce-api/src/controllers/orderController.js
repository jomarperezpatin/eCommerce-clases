import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";
import PaymentMethod from "../models/PaymentMethod.js";

// Nunca exponer el hash de la contraseña al hacer populate del usuario
const USER_FIELDS = "name email";

// ---------- Reglas de negocio de costos ----------
// Estos valores deben coincidir con lo que muestra el frontend, pero la
// fuente de verdad para el cálculo es SIEMPRE este controlador.
const TAX_RATE = 0.16; // IVA 16 %
const SHIPPING_RATE = 350; // Costo de envío estándar
const FREE_SHIPPING_THRESHOLD = 1000; // Envío gratis si subtotal >= 1000

// Devuelve al inventario lo que se habia descontado
const releaseStock = (items) =>
  Promise.all(
    items.map(({ productId, quantity }) =>
      Product.updateOne({ _id: productId }, { $inc: { stock: quantity } }),
    ),
  );

// Descuenta el stock de cada producto de la orden.
// El filtro { stock: { $gte: quantity } } hace la operacion atomica: Mongo solo
// descuenta si alcanza, asi dos compras simultaneas no pueden dejar stock negativo.
// Si un producto no alcanza, se devuelve lo ya descontado y se rechaza la orden.
const reserveStock = async (products) => {
  // Si el mismo producto viene dos veces, se suman sus cantidades
  const quantities = new Map();
  for (const { productId, quantity } of products) {
    const key = String(productId);
    quantities.set(key, (quantities.get(key) || 0) + Number(quantity));
  }

  const reserved = [];
  for (const [productId, quantity] of quantities) {
    const updated = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
    );

    if (!updated) {
      await releaseStock(reserved);
      const product = await Product.findById(productId).select("name stock");
      return {
        ok: false,
        status: product ? 409 : 404,
        message: product
          ? `Stock insuficiente para "${product.name}". Disponibles: ${product.stock}`
          : "Uno de los productos ya no existe",
      };
    }
    reserved.push({ productId, quantity });
  }

  return { ok: true, reserved };
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", USER_FIELDS)
      .populate("products.productId")
      .populate("address")
      .populate("paymentMethod");
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("products.productId")
      .populate("address")
      .populate("paymentMethod", "type cardHolderName cardNumber");
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("user", USER_FIELDS)
      .populate("products.productId")
      .populate("address")
      .populate("paymentMethod");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner = String(order.user?._id) === String(req.user.userId);
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { products, address, paymentMethod } = req.body;

    // ---- 1. Validar que la dirección y el método de pago pertenezcan al usuario ----
    const [userAddress, userPayment] = await Promise.all([
      Address.findOne({ _id: address, user: userId }),
      PaymentMethod.findOne({ _id: paymentMethod, user: userId }),
    ]);

    if (!userAddress) {
      return res
        .status(404)
        .json({ message: "Dirección no encontrada o no pertenece al usuario" });
    }
    if (!userPayment) {
      return res
        .status(404)
        .json({ message: "Método de pago no encontrado o no pertenece al usuario" });
    }

    // ---- 2. Obtener los precios REALES de la base de datos ----
    const productIds = products.map((p) => p.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();

    // Crear un mapa para búsqueda rápida por _id
    const productMap = new Map();
    for (const p of dbProducts) {
      productMap.set(String(p._id), p);
    }

    // Verificar que todos los productos existen y construir el arreglo con precios reales
    const orderProducts = [];
    for (const item of products) {
      const dbProduct = productMap.get(String(item.productId));
      if (!dbProduct) {
        return res.status(404).json({
          message: `El producto con ID "${item.productId}" no existe`,
        });
      }
      orderProducts.push({
        productId: dbProduct._id,
        quantity: item.quantity,
        price: dbProduct.price, // Precio REAL de la BD, NUNCA del cliente
      });
    }

    // ---- 3. Calcular subtotal, IVA, envío y total en el servidor ----
    const subtotal = orderProducts.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
    const totalPrice = parseFloat(
      (subtotal + taxAmount + shippingCost).toFixed(2),
    );

    // ---- 4. Reservar stock (operación atómica) ----
    const stock = await reserveStock(orderProducts);
    if (!stock.ok) {
      return res.status(stock.status).json({ message: stock.message });
    }

    // ---- 5. Crear la orden con los datos calculados por el servidor ----
    let newOrder;
    try {
      newOrder = await Order.create({
        user: userId,
        products: orderProducts,
        address,
        paymentMethod,
        subtotal,
        taxAmount,
        shippingCost,
        totalPrice,
      });
    } catch (error) {
      // Si la orden no se pudo guardar, el stock regresa al inventario
      await releaseStock(stock.reserved);
      throw error;
    }

    await newOrder.populate("user", USER_FIELDS);
    await newOrder.populate("products.productId");
    await newOrder.populate("address");
    await newOrder.populate("paymentMethod");

    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const updated = await Order.findByIdAndUpdate(
      id,
      { status, paymentStatus },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export { getOrders, getMyOrders, getOrderById, createOrder, updateOrderStatus };
