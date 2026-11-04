import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/common/Icon/Icon";
import "./OrderConfirmation.css";

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { nuevaOrden } = location.state || {};

  useEffect(() => {
    if (!nuevaOrden) {
      navigate("/");
      return;
    }
  }, [nuevaOrden, navigate]);

  if (!nuevaOrden) return null;

  const address = nuevaOrden.address || {};
  const subtotal = nuevaOrden.subtotal || 0;
  const tax = nuevaOrden.taxAmount || 0;
  const shipping = nuevaOrden.shippingCost || 0;
  const total = nuevaOrden.totalPrice || 0;
  const orderDate = nuevaOrden.createdAt
    ? new Date(nuevaOrden.createdAt).toLocaleDateString()
    : "No disponible";

  // Utilidad para formatear moneda (MXN)
  const formatMoney = (v) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(v);

  return (
    <div className="order-confirmation">
      <div className="confirmation-content">
        <div className="confirmation-icon">
          <Icon name="checkCircle" size={64} className="success"></Icon>
        </div>
        <h1>¡Gracias por tu compra!</h1>
        <p className="confirmation-message">
          Tu pedido <strong>#{nuevaOrden._id || "N/A"}</strong> ha sido confirmado y
          está siendo procesado
        </p>
        <div className="confirmation-details">
          <h2>Detalles de tu pedido</h2>
          <div className="order-info">
            <p>
              <strong>Fecha: </strong>
              {orderDate}
            </p>
            <h3>Productos</h3>
            <ul className="order-items">
              {(nuevaOrden.products || []).map((item) => (
                <li key={item._id}>
                  {item.productId?.name} x {item.quantity} - {formatMoney(item.price)}
                </li>
              ))}
            </ul>
            <div className="order-totals">
              <p>
                <strong>Subtotal: </strong>
                {formatMoney(subtotal)}
              </p>
              <p>
                <strong>IVA: </strong>
                {formatMoney(tax)}
              </p>
              <p>
                <strong>Envío: </strong>
                {shipping === 0 ? "Gratis" : formatMoney(shipping)}
              </p>
              <p>
                <strong>Total:</strong> {formatMoney(total)}
              </p>

              <p>
                <strong>Dirección de envío:</strong>
              </p>
              <address>
                {address.name || "No disponible"}
                <br />
                {address.address || ""}
                {address.address && <br />}
                {address.city && address.postalCode
                  ? `${address.city}, ${address.postalCode}`
                  : "Ciudad y código postal no disponibles"}
                <br />
                {address.country || "País no especificado"}
              </address>
            </div>
          </div>
          <p>
            Hemos enviado un correo electrónico con los detalles de tu compra.
            También puedes ver el estado de tu pedido en cualquier momento desde
            tu perfil.
          </p>
        </div>
        <div className="confirmation-actions">
          <Link to="/" className="button primary">
            <Icon name="home" size={20} />
            <span>Volver al inicio</span>
          </Link>
          <Link to="/orders" className="button secondary">
            <Icon name="package" size={20} />
            <span>Ver mis pedidos</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
