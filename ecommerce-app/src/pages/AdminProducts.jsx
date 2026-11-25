import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import Loading from "../components/common/Loading/Loading";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import ProductTable from "../components/Admin/ProductTable/ProductTable";
import { deleteProduct, getAllProducts } from "../services/productsService";
import useFetch from "../hooks/useFetch";
import "./AdminProducts.css";

export default function AdminProducts() {
  const navigate = useNavigate();
  const {
    data: productsData,
    loading,
    error,
    setData: setProducts,
  } = useFetch(getAllProducts, [], {
    default: "No se pudieron cargar los productos",
  });
  const products = productsData || [];
  const [deletingId, setDeletingId] = useState(null);

  const handleEdit = (id) => navigate(`/admin/products/${id}/edit`);

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(product._id);
    try {
      await deleteProduct(product._id);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
    } catch (err) {
      alert(err.response?.data?.message || "No se pudo eliminar el producto");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <Loading message="Cargando productos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Panel de administración</p>
          <h1>Productos</h1>
          <p className="admin-subtitle">{products.length} productos en catálogo</p>
        </div>
        <Button onClick={() => navigate("/admin/products/new")}>
          Crear producto
        </Button>
      </header>

      {products.length ? (
        <ProductTable
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      ) : (
        <p className="admin-empty">Todavía no hay productos.</p>
      )}
    </div>
  );
}
