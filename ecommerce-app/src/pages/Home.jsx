import BannerCarousel from "../components/BannerCarousel";
import List from "../components/List/List";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Loading from "../components/common/Loading/Loading";
import homeImages from "../data/homeImages.json";
import { getAllProducts } from "../services/productsService";
import useFetch from "../hooks/useFetch";

export default function Home() {
  const {
    data: productsData,
    loading,
    error,
  } = useFetch(getAllProducts, [], {
    notFound: "No hay productos en el catálogo",
    default: "No se pudieron cargar los productos. Intenta más tarde.",
  });
  const products = productsData || [];

  return (
    <div>
      <BannerCarousel banners={homeImages} />
      {loading ? (
        <Loading>Cargando productos...</Loading>
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : products.length > 0 ? (
        <List
          title="Productos recomendados"
          products={products}
          layout="grid"
        />
      ) : (
        <ErrorMessage>No hay productos en el catálogo</ErrorMessage>
      )}
    </div>
  );
}
