import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CartView from "../components/Cart/CartView";
import AddressForm from "../components/Checkout/Address/AddressForm";
import AddressList from "../components/Checkout/Address/AddressList";
import PaymentForm from "../components/Checkout/Payment/PaymentForm";
import PaymentList from "../components/Checkout/Payment/PaymentList";
import SummarySection from "../components/Checkout/shared/SummarySection";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Icon from "../components/common/Icon/Icon";
import Loading from "../components/common/Loading/Loading";
import { useCart } from "../context/CartContext";
import {
  createPaymetMethod,
  deletePaymetMethod,
  getDefaultPaymentMethod,
  getPaymentMethods,
  updatePaymetMethod,
} from "../services/paymentService";
import {
  createAddress,
  deleteAddress,
  getDefaultShippingAddress,
  getShippingAddresses,
  updateAddress,
} from "../services/shippingService";
import "./Checkout.css";
import { createOrder } from "../services/orderService";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, total, clearCart, syncStock } = useCart();

  // --- LÓGICA DE NEGOCIO FINANCIERA ---
  // Cálculos derivados del estado del carrito.
  // Se realizan en cada render para asegurar consistencia.
  // NOTA: Estos valores son solo para MOSTRAR al usuario. La fuente de
  // verdad es el backend, que recalcula todo al crear la orden.
  const subtotal = typeof total === "number" ? total : 0;
  const TAX_RATE = 0.16; // IVA 16%
  const SHIPPING_RATE = 350; // Costo de envío estándar
  const FREE_SHIPPING_THRESHOLD = 1000; // Envío gratis si subtotal >= 1000

  const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
  const grandTotal = parseFloat(
    (subtotal + taxAmount + shippingCost).toFixed(2)
  );
  
  const [isOrderFinished, setIsOrderFinished] = useState(false);
  // Envio de la orden: bloquea el boton (evita ordenes dobles) y guarda el
  // error para mostrarlo junto al boton, sin reemplazar toda la pagina
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // Utilidad para formatear moneda (MXN)
  const formatMoney = (v) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(v);

  // --- EFECTOS Y REFERENCIAS ---

  // Efecto de protección de ruta:
  // Si el carrito está vacío y no estamos en proceso de confirmación, redirigir al carrito.
  useEffect(() => {
    
    if (!cartItems || cartItems.length === 0) {
      if (!isOrderFinished) {
        navigate("/cart");
      }
    }
  }, [cartItems, navigate, isOrderFinished]);

  // --- ESTADOS LOCALES (Gestión de UI y Datos) ---

  // Datos principales (Direcciones y Pagos)
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);

  // Estados de carga y error para la obtención inicial de datos
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [localError, setLocalError] = useState(null);

  // Control de visibilidad de formularios (Modo Edición/Creación)
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Elementos que se están editando actualmente (null si es creación)
  const [editingAddress, setEditingAddress] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);

  // Control de acordeones/secciones expandidas
  const [addressSectionOpen, setAddressSectionOpen] = useState(false);
  const [paymentSectionOpen, setPaymentSectionOpen] = useState(false);

  // Selección actual del usuario
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // --- CARGA DE DATOS INICIAL ---
  useEffect(() => {
    /**
     * Función asíncrona para cargar datos iniciales.
     * Obtiene direcciones y métodos de pago en paralelo.
     * Establece los valores por defecto si existen.
     */
    async function loadData() {
      setLoadingLocal(true);
      setLocalError(null);
      try {
        // Carga paralela de datos para mejorar performance
        const [addrList, firstAddress, payList, firstPayment] =
          await Promise.all([
            getShippingAddresses(),
            getDefaultShippingAddress(),
            getPaymentMethods(),
            getDefaultPaymentMethod(),
          ]);

        setAddresses(addrList || []);
        setPayments(payList || []);

        // Pre-seleccionar valores por defecto
        setSelectedAddress(firstAddress);
        setSelectedPayment(firstPayment);

        // Abrir secciones si no hay datos seleccionados
        setAddressSectionOpen(!firstAddress);
        setPaymentSectionOpen(!firstPayment);
      } catch (err) {
        setLocalError("No se pudo cargar direcciones o métodos de pago.");
      } finally {
        setLoadingLocal(false);
      }
    }

    loadData();
  }, []);

  // --- HANDLERS PARA DIRECCIONES (API) ---

  /**
   * Alterna la visibilidad de la sección de direcciones.
   * Cierra el formulario si estaba abierto.
   */
  const handleAddressToggle = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen((prev) => !prev);
  };

  /**
   * Selecciona una dirección existente y cierra el acordeón.
   * @param {Object} address - La dirección seleccionada.
   */
  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen(false);
  };

  /**
   * Inicia el proceso de creación de una nueva dirección.
   * Abre el formulario en modo creación.
   */
  const handleAddressNew = () => {
    setShowAddressForm(true);
    setEditingAddress(null);
    setAddressSectionOpen(true);
  };

  /**
   * Inicia el proceso de edición de una dirección existente.
   * Abre el formulario precargado con los datos de la dirección.
   * @param {Object} address - La dirección a editar.
   */
  const handleAddressEdit = (address) => {
    setShowAddressForm(true);
    setEditingAddress(address);
    setAddressSectionOpen(true);
  };

  /**
   * Elimina una dirección en la API y recarga la lista.
   * Si la dirección eliminada estaba seleccionada, intenta seleccionar otra.
   */
  const handleAddressDelete = async(address) => {
    if(!window.confirm("¿Eliminar direccion?")) return;

    try {
      await deleteAddress(address._id);
      const updated = await getShippingAddresses();
      setAddresses(updated);
      if (selectedAddress?._id === address._id) {
        setSelectedAddress(updated[0] || null);
      }
    } catch (err) {
      setLocalError("No se pudo eliminar la direccion");
    }
  };

  /**
   * Maneja el guardado (Creación o Edición) de una dirección.
   * Actualiza la lista local y la selección automáticamente para mejorar UX.
   */
  const handleAddressSubmit = async (formData) => {
    try {
      if (editingAddress){
        await updateAddress(editingAddress._id, formData)
      } else {
        await createAddress(formData);
      }
      const updated = await getShippingAddresses();
      setAddresses(updated);
      setSelectedAddress(updated[updated.length-1]);
    } catch (err) {
      setLocalError("No se pudo guardar la direccion")
    } finally {
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressSectionOpen(false);
    }
  };

  /**
   * Cancela la operación actual (creación o edición) de dirección.
   * Cierra el formulario y limpia el estado de edición.
   */
  const handleCancelAddress = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen(false);
  };

  // --- HANDLERS PARA PAGOS (API) ---

  /**
   * Alterna la visibilidad de la sección de pagos.
   * Cierra el formulario si estaba abierto.
   */
  const handlePaymentToggle = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen((prev) => !prev);
  };

  /**
   * Selecciona un método de pago existente y cierra el acordeón.
   * @param {Object} payment - El método de pago seleccionado.
   */
  const handleSelectPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen(false);
  };

  /**
   * Inicia el proceso de creación de un nuevo método de pago.
   * Abre el formulario en modo creación.
   */
  const handlePaymentNew = () => {
    setShowPaymentForm(true);
    setEditingPayment(null);
    setPaymentSectionOpen(true);
  };

  /**
   * Inicia el proceso de edición de un método de pago existente.
   * Abre el formulario precargado con los datos del pago.
   * @param {Object} payment - El método de pago a editar.
   */
  const handlePaymentEdit = (payment) => {
    setShowPaymentForm(true);
    setEditingPayment(payment);
    setPaymentSectionOpen(true);
  };

  /**
   * Elimina un método de pago en la API y recarga la lista.
   * Si el pago eliminado estaba seleccionado, intenta seleccionar otro.
   * @param {Object} payment - El método de pago a eliminar.
   */
  const handlePaymentDelete = async (payment) => {
    if (!window.confirm("Eliminar este método de pago?")) return;
    try{
      await deletePaymetMethod(payment._id);
      const updated = await getPaymentMethods();
      setPayments(updated);
      if(selectedPayment?._id === payment._id){
        setSelectedPayment(updated[0] || null);
      }
    } catch (err) {
      setLocalError("No se pudo eliminar el método de pago")
    }
  };

  /**
   * Maneja el guardado (Creación o Edición) de un método de pago.
   * Actualiza la lista local y la selección automáticamente.
   * @param {Object} formData - Datos del formulario de pago.
   */
  const handlePaymentSubmit = async (formData) => {
    try {
      if (editingPayment){
        await updatePaymetMethod(editingPayment._id, formData)
      } else {
        await createPaymetMethod(formData);
      }
      const updated = await getPaymentMethods();
      setPayments(updated);
    } catch (err) {
      setLocalError("No se pudo guardar el método de pago")
    } finally {
      setShowPaymentForm(false);
      setEditingPayment(null);
      setPaymentSectionOpen(false);
    }
  };

  /**
   * Cancela la operación actual (creación o edición) de pago.
   * Cierra el formulario y limpia el estado de edición.
   */
  const handleCancelPayment = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen(false);
  };

  // --- FINALIZACIÓN DE ORDEN ---

  /**
   * Crea la orden en la API, redirige a la confirmación y limpia el carrito.
   * Solo envía productId y quantity; el backend calcula precios y totales.
   */
  const handleCreateOrder = async () => {
    if (
      placingOrder ||
      !selectedAddress ||
      !selectedPayment ||
      !cartItems ||
      cartItems.length === 0
    ) {
      return;
    }

    const orderData = {
      products: cartItems.map((item) => ({
        productId: item._id,
        quantity: item.quantity,
      })),
      address: selectedAddress._id,
      paymentMethod: selectedPayment._id,
    };

    setPlacingOrder(true);
    setOrderError(null);
    try{
      const nuevaOrden = await createOrder(orderData);
      setIsOrderFinished(true);
      navigate("/order-confirmation", { state: { nuevaOrden } });
      clearCart();
    } catch (err){
      if (err.response?.status === 409) {
        // Alguien compro antes que tu: el carrito se ajusta al stock real y
        // el aviso de CartView explica que cambio
        await syncStock();
        setOrderError(
          "Algunos productos ya no tienen suficiente stock. Ajustamos tu carrito: revisa las cantidades y confirma de nuevo."
        );
      } else {
        setOrderError(
          err.response?.data?.message ||
            "No se pudo crear la orden. Intentalo de nuevo"
        );
      }
      setPlacingOrder(false);
    }
  };

  return (
    // Mostrar loading o error antes del contenido principal
    loadingLocal ? (
      <Loading message="Cargando direcciones y métodos de pago..." />
    ) : localError ? (
      <ErrorMessage message={localError} />
    ) : (
      <div className="checkout-container">
        <div className="checkout-left">
          <SummarySection
            title="1. Dirección de envío"
            selected={selectedAddress}
            summaryContent={
              <div className="selected-address">
                <p>{selectedAddress?.name}</p>
                <p>{selectedAddress?.address}</p>
                <p>
                  {selectedAddress?.city}, {selectedAddress?.postalCode}
                </p>
              </div>
            }
            isExpanded={
              showAddressForm || addressSectionOpen || !selectedAddress
            }
            onToggle={handleAddressToggle}
          >
            {!showAddressForm && !editingAddress ? (
              <AddressList
                addresses={addresses}
                selectedAddress={selectedAddress}
                onSelect={handleSelectAddress}
                onEdit={handleAddressEdit}
                onAdd={handleAddressNew}
                onDelete={handleAddressDelete}
              />
            ) : (
              <AddressForm
                onSubmit={handleAddressSubmit}
                onCancel={handleCancelAddress}
                initialValues={editingAddress || {}}
                isEdit={!!editingAddress}
              />
            )}
          </SummarySection>

          <SummarySection
            title="2. Método de pago"
            selected={selectedPayment}
            summaryContent={
              <div className="selected-payment">
                <p>{selectedPayment?.cardHolderName}</p>
                <p>**** **** **** {selectedPayment?.cardNumber?.slice(-4) || "----"}</p>
              </div>
            }
            isExpanded={
              showPaymentForm || paymentSectionOpen || !selectedPayment
            }
            onToggle={handlePaymentToggle}
          >
            {!showPaymentForm && !editingPayment ? (
              <PaymentList
                payments={payments}
                selectedPayment={selectedPayment}
                onSelect={handleSelectPayment}
                onEdit={handlePaymentEdit}
                onAdd={handlePaymentNew}
                onDelete={handlePaymentDelete}
              />
            ) : (
              <PaymentForm
                onSubmit={handlePaymentSubmit}
                onCancel={handleCancelPayment}
                initialValues={editingPayment || {}}
                isEdit={!!editingPayment}
              />
            )}
          </SummarySection>

          <SummarySection
            title="3. Revisa tu pedido"
            selected={true}
            isExpanded={true}
          >
            <CartView />
          </SummarySection>
        </div>

        <div className="checkout-right">
          <div className="checkout-summary">
            <h3>Resumen de la Orden</h3>
            <div className="summary-details">
              <p>
                <strong>Dirección de envío:</strong> {selectedAddress?.name}
              </p>
              <p>
                <strong>Método de pago:</strong> {selectedPayment?.cardHolderName}
                {selectedPayment?.cardNumber &&
                  ` · **** ${selectedPayment.cardNumber.slice(-4)}`}
              </p>
              <div className="order-costs">
                <p>
                  <strong>Subtotal:</strong> {formatMoney(subtotal)}
                </p>
                <p>
                  <strong>IVA (16%):</strong> {formatMoney(taxAmount)}
                </p>
                <p>
                  <strong>Envío:</strong>{" "}
                  {shippingCost === 0 ? "Gratis" : formatMoney(shippingCost)}
                </p>
                <hr />
                <p>
                  <strong>Total:</strong> {formatMoney(grandTotal)}
                </p>
              </div>
              <p>
                <strong>Fecha estimada de entrega:</strong>{" "}
                {new Date(
                  Date.now() + 7 * 24 * 60 * 60 * 1000
                ).toLocaleDateString()}
              </p>
            </div>
            {orderError && (
              <div className="checkout-order-error" role="alert">
                <Icon name="alertCircle" size={18} />
                <span>{orderError}</span>
              </div>
            )}
            <Button
              className="pay-button"
              disabled={
                placingOrder ||
                !selectedAddress ||
                !selectedPayment ||
                !cartItems ||
                cartItems.length === 0
              }
              title={
                !cartItems || cartItems.length === 0
                  ? "No hay productos en el carrito"
                  : !selectedAddress
                  ? "Selecciona una dirección de envío"
                  : !selectedPayment
                  ? "Selecciona un método de pago"
                  : "Confirmar y realizar el pago"
              }
              onClick={handleCreateOrder}
            >
              {placingOrder ? "Procesando..." : "Confirmar y Pagar"}
            </Button>
          </div>
        </div>
      </div>
    )
  );
}
