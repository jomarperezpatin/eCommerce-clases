import { useState, useEffect, useCallback } from "react";

/**
 * Traduce errores de HTTP y de red a mensajes amigables para el usuario.
 */
function translateError(err, options = {}) {
  const status = err?.response?.status;
  if (status === 404) {
    return options.notFound || "Este producto no existe o fue removido";
  }
  if (status >= 500) {
    return (
      options.serverError ||
      "Tuvimos un problema con el servidor. Intentalo mas tarde"
    );
  }
  if (!err?.response) {
    return options.network || "No pudimos conectar, revisa tu conexion";
  }
  return (
    err.response?.data?.message ||
    options.default ||
    "Ocurrio un error al cargar el producto"
  );
}

/**
 * Hook reutilizable para peticiones de datos con estados de loading, error y traducción de status HTTP.
 *
 * @param {Function} peticion - Función asíncrona que retorna la promesa con los datos
 * @param {Array} dependencias - Arreglo de dependencias para volver a ejecutar la petición
 * @param {Object} options - Configuración opcional para sobreescribir mensajes de error o comportamiento
 * @returns {{ data: any, loading: boolean, error: string|null, setData: Function, refetch: Function }}
 */
export function useFetch(peticion, dependencias = [], options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const executeFetch = useCallback(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.resolve()
      .then(() => peticion())
      .then((resultado) => {
        if (!isMounted) return;
        if ((resultado === null || resultado === undefined) && options.notFoundOnFalsy) {
          setError(options.notFound || "Producto no encontrado");
        } else {
          setData(resultado);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(translateError(err, options));
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  useEffect(() => {
    const cleanup = executeFetch();
    return () => {
      if (cleanup) cleanup();
    };
  }, [executeFetch]);

  return { data, loading, error, setData, refetch: executeFetch };
}

export default useFetch;