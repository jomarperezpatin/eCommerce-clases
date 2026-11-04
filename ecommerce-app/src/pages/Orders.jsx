import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import Icon from "../components/common/Icon/Icon";
import Loading from "../components/common/Loading/Loading";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import { getMyOrders } from "../services/orderService";
import "./Orders.css";

const STATUS_LABELS = {
  pending: "Pendiente",
  processing: "En proceso",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const PAYMENT_TYPE_LABELS = {
  credit_card: "Tarjeta de crédito",
  debit_card: "Tarjeta de débito",
  paypal: "PayPal",
  bank_transfer: "Transferencia bancaria",
  cash_on_delivery: "Pago contra entrega",
};

// Adapta la orden del backend a la forma que usa esta página
const normalizeOrder = (order) => {
  const items = (order.products || []).map((item) => ({
    id: item.productId?._id || item._id,
    name: item.productId?.name,
    price: item.price,
    quantity: item.quantity,
  }));

  // Usar los valores calculados por el servidor directamente
  const subtotal = order.subtotal || items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );
  const tax = order.taxAmount || 0;
  const shipping = order.shippingCost || 0;
  const total = order.totalPrice || 0;

  return {
    id: order._id,
    shortId: order._id?.slice(-6).toUpperCase(),
    date: order.createdAt,
    statusToken: order.status || "pending",
    status: STATUS_LABELS[order.status] || order.status,
    items,
    subtotal,
    tax,
    shipping,
    total,
    shippingAddress: order.address && {
      name: order.address.name,
      address1: order.address.address,
      city: order.address.city,
      postalCode: order.address.postalCode,
      country: order.address.country,
    },
    paymentMethod: order.paymentMethod && {
      alias:
        PAYMENT_TYPE_LABELS[order.paymentMethod.type] ||
        order.paymentMethod.type,
      cardNumber: order.paymentMethod.cardNumber,
    },
  };
};

const formatMoney = (value = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);

const formatDate = (isoString) => {
  if (!isoString) return "Fecha desconocida";
  try {
    return new Date(isoString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return "Fecha inválida";
  }
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      try {
        const data = await getMyOrders();
        if (ignore) return;
        const sortedOrders = data
          .map(normalizeOrder)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setOrders(sortedOrders);
        setSelectedOrderId((current) => current ?? sortedOrders[0]?.id ?? null);
      } catch (err) {
        if (ignore) return;
        setError(
          err.response?.data?.message || "No se pudieron cargar tus pedidos"
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadOrders();
    return () => {
      ignore = true;
    };
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const detailStatusToken = selectedOrder?.statusToken || "pending";
  const detailStatusLabel = selectedOrder?.status || "Pendiente";

  if (loading) {
    return (
      <div className="orders-page">
        <Loading message="Cargando pedidos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="orders-page orders-empty">
        <Icon name="package" size={48} />
        <h1>Aún no tienes pedidos</h1>
        <p>
          Cada vez que confirmes una compra en el checkout, la orden aparecerá
          aquí para que puedas consultarla más tarde.
        </p>
        <Link to="/" className="orders-link">
          <Button>Descubrir productos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <p className="eyebrow">Historial de compras</p>
          <h1>Mis pedidos</h1>
          <p className="muted">
            {orders.length === 1
              ? "Tienes 1 pedido"
              : `Tienes ${orders.length} pedidos`}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setSelectedOrderId(orders[0]?.id ?? null)}
        >
          Ver más reciente
        </Button>
      </div>

      <div className="orders-content">
        <div className="orders-list card">
          <div className="orders-list-header">
            <h2>Pedidos</h2>
            <span>{orders.length}</span>
          </div>
          <div className="orders-list-body">
            {orders.map((order) => {
              const itemCount = order.items?.length || 0;
              const statusToken = order.statusToken;
              const isActive = selectedOrderId === order.id;
              return (
                <button
                  key={order.id}
                  className={`order-card${isActive ? " active" : ""}`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <div className="order-card-head">
                    <span className="order-id">#{order.shortId}</span>
                    <span
                      className={`order-status order-status-${statusToken}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="order-date">{formatDate(order.date)}</p>
                  <div className="order-card-meta">
                    <span>{itemCount} artículos</span>
                    <strong>{formatMoney(order.total || 0)}</strong>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="orders-detail card">
          {selectedOrder ? (
            <>
              <div className="order-detail-header">
                <div>
                  <p className="eyebrow">Pedido #{selectedOrder.shortId}</p>
                  <h2>{formatMoney(selectedOrder.total || 0)}</h2>
                  <p className="muted">{formatDate(selectedOrder.date)}</p>
                </div>
                <span
                  className={`order-status order-status-${detailStatusToken}`}
                >
                  {detailStatusLabel}
                </span>
              </div>

              <div className="order-section">
                <h3>Resumen del pago</h3>
                <ul className="order-summary-list">
                  <li>
                    <span>Subtotal</span>
                    <strong>{formatMoney(selectedOrder.subtotal || 0)}</strong>
                  </li>
                  <li>
                    <span>IVA</span>
                    <strong>{formatMoney(selectedOrder.tax || 0)}</strong>
                  </li>
                  <li>
                    <span>Envío</span>
                    <strong>
                      {selectedOrder.shipping === 0
                        ? "Gratis"
                        : formatMoney(selectedOrder.shipping || 0)}
                    </strong>
                  </li>
                  <li className="order-summary-total">
                    <span>Total</span>
                    <strong>{formatMoney(selectedOrder.total || 0)}</strong>
                  </li>
                </ul>
              </div>

              <div className="order-section">
                <h3>Dirección de envío</h3>
                {selectedOrder.shippingAddress ? (
                  <address className="order-address">
                    <strong>{selectedOrder.shippingAddress.name}</strong>
                    <p>{selectedOrder.shippingAddress.address1}</p>
                    <p>
                      {selectedOrder.shippingAddress.city},{" "}
                      {selectedOrder.shippingAddress.postalCode}
                    </p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </address>
                ) : (
                  <p className="muted">Sin dirección registrada.</p>
                )}
              </div>

              <div className="order-section">
                <h3>Método de pago</h3>
                {selectedOrder.paymentMethod ? (
                  <div>
                    <p>{selectedOrder.paymentMethod.alias}</p>
                    <p>
                      ****{" "}
                      {selectedOrder.paymentMethod.cardNumber?.slice(-4) ||
                        "----"}
                    </p>
                  </div>
                ) : (
                  <p className="muted">Sin método de pago registrado.</p>
                )}
              </div>

              <div className="order-section">
                <h3>Productos</h3>
                <ul className="order-items">
                  {selectedOrder.items?.map((item, index) => (
                    <li key={`${selectedOrder.id}-${item.id || index}`}>
                      <div>
                        <p>{item.name || "Producto"}</p>
                        <span>
                          Cantidad: {item.quantity || 1} · Precio:{" "}
                          {formatMoney(item.price || 0)}
                        </span>
                      </div>
                      <strong>
                        {formatMoney((item.price || 0) * (item.quantity || 1))}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="orders-empty">
              <h3>Selecciona un pedido de la lista</h3>
              <p className="muted">
                Aquí verás el detalle completo: productos, dirección y método de
                pago utilizados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
