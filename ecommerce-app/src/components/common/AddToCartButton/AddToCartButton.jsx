import { useEffect, useRef, useState } from "react";
import { useCart } from "../../../context/CartContext";
import { carryToCart } from "../../../utils/carryToCart";
import Button from "../Button";
import Icon from "../Icon/Icon";
import "./AddToCartButton.css";

const FEEDBACK_MS = 1800;

// Boton "Agregar al carrito" con tope de stock y retroalimentacion: un carrito
// viene por la foto del producto (imageRef) y la lleva al carrito del Header.
// Al aterrizar se suma la unidad y el boton confirma "¡Agregado!".
export default function AddToCartButton({
  product,
  imageRef,
  size = "base",
  className = "",
}) {
  const { addToCart, getQuantityInCart } = useCart();
  // idle | adding (el carrito va en camino) | added (confirmacion)
  const [status, setStatus] = useState("idle");
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const stock = product?.stock ?? 0;
  const inCart = getQuantityInCart(product?._id);
  const remaining = Math.max(0, stock - inCart);

  const handleClick = async () => {
    if (status === "adding" || remaining <= 0) return;

    setStatus("adding");
    await carryToCart(imageRef?.current);
    const added = addToCart(product, 1);

    clearTimeout(timerRef.current);
    setStatus(added > 0 ? "added" : "idle");
    timerRef.current = setTimeout(() => setStatus("idle"), FEEDBACK_MS);
  };

  let label = "Agregar al carrito";
  let icon = "cart";
  let title;
  if (status === "adding") {
    label = "Agregando...";
    icon = "shoppingCart";
  } else if (status === "added") {
    label = "¡Agregado!";
    icon = "check";
  } else if (stock <= 0) {
    label = "Agotado";
    icon = null;
  } else if (remaining <= 0) {
    label = "Máximo en carrito";
    icon = null;
    title =
      stock === 1
        ? "Ya tienes en tu carrito la única unidad disponible"
        : `Ya tienes en tu carrito las ${stock} unidades disponibles`;
  }

  const buttonClasses = [
    "add-to-cart-btn",
    status !== "idle" ? `is-${status}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <Button
        variant="primary"
        size={size}
        className={buttonClasses}
        disabled={status === "adding" || remaining <= 0}
        onClick={handleClick}
        title={title}
        data-testid="add-to-cart-btn"
      >
        {icon && (
          <span className="add-to-cart-icon" key={icon}>
            <Icon name={icon} size={size === "lg" ? 20 : 16} />
          </span>
        )}
        <span>{label}</span>
      </Button>
      <span className="visually-hidden" role="status">
        {status === "added" ? `${product.name} se agregó al carrito` : ""}
      </span>
    </>
  );
}
