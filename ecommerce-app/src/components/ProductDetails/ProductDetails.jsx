import { useRef } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import Breadcrumb from "../../layout/Breadcrumb/Breadcrumb";
import { getProductById } from "../../services/productsService";
import AddToCartButton from "../common/AddToCartButton/AddToCartButton";
import Badge from "../common/Badge";
import ErrorMessage from "../common/ErrorMessage/ErrorMessage";
import Loading from "../common/Loading/Loading";
import useFetch from "../../hooks/useFetch";
import "./ProductDetails.css";

export default function ProductDetails({ productId }) {
  const { getQuantityInCart } = useCart();
  // La foto que el carrito animado se lleva al Header
  const imageRef = useRef(null);

  const { data: product, loading, error } = useFetch(
    () => getProductById(productId),
    [productId],
    { notFoundOnFalsy: true }
  );

  const resolvedCategory = product?.category || null;

  if (loading) {
    return (
      <div className="product-details-container">
        <Loading message="Cargando producto..." />
      </div>
    );
  }
  if (error) {
    return (
      <div className="product-details-container">
        <ErrorMessage message={error}>
          <p className="muted">
            Revisa nuestra <Link to="/">página principal</Link> o explora otras
            categorías.
          </p>
        </ErrorMessage>
      </div>
    );
  }
  if (!product) return null;

  const { name, description, price, stock, imagesUrl, category } = product;
  const stockBadge = stock > 0 ? "success" : "error";
  const stockLabel = stock > 0 ? "En stock" : "Agotado";
  const inCart = getQuantityInCart(product._id);

  return (
    <div className="product-details-container">
      <Breadcrumb categories={resolvedCategory} />
      <div className="product-details-main">
        <div className="product-details-image">
          <img
            ref={imageRef}
            src={imagesUrl?.[0] || "/img/products/placeholder.svg"}
            alt={name}
            onError={(event) => {
              event.target.src = "/img/products/placeholder.svg";
            }}
          />
        </div>
        <div className="product-details-info">
          <div className="product-details-title">
            <h1 className="h1">{name}</h1>
            {(resolvedCategory?.name || category?.name) && (
              <span className="product-details-category">
                {resolvedCategory?.name || category?.name}
              </span>
            )}
          </div>
          <p className="product-details-description">{description}</p>
          <div className="product-details-stock">
            <Badge text={stockLabel} variant={stockBadge} />
            {stock > 0 && (
              <span className="muted">
                {stock} {stock === 1 ? "unidad disponible" : "unidades disponibles"}
                {inCart > 0 && ` · ${inCart} en tu carrito`}
              </span>
            )}
          </div>
          <div className="product-details-price">${price}</div>
          <div className="product-details-actions">
            <AddToCartButton product={product} imageRef={imageRef} size="lg" />
            <Link to="/cart" className="btn btn-outline btn-lg">
              Ver carrito
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
