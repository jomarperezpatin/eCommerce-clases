import { renderHook, waitFor, act } from "@testing-library/react";
import useFetch from "./useFetch";

describe("useFetch hook", () => {
  it("debe cargar los datos exitosamente y manejar loading", async () => {
    const mockData = [{ id: 1, name: "Producto 1" }];
    const peticion = jest.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useFetch(peticion, []));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it("debe traducir el error 404 al mensaje correspondiente", async () => {
    const error404 = {
      response: {
        status: 404,
        data: { message: "Not found" },
      },
    };
    const peticion = jest.fn().mockRejectedValue(error404);

    const { result } = renderHook(() => useFetch(peticion, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Este producto no existe o fue removido");
  });

  it("debe traducir el error 500 al mensaje de servidor", async () => {
    const error500 = {
      response: {
        status: 500,
        data: {},
      },
    };
    const peticion = jest.fn().mockRejectedValue(error500);

    const { result } = renderHook(() => useFetch(peticion, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(
      "Tuvimos un problema con el servidor. Intentalo mas tarde"
    );
  });

  it("debe traducir el error sin respuesta (sin conexion de red)", async () => {
    const errorNetwork = new Error("Network Error");
    // Sin response en el objeto de error
    const peticion = jest.fn().mockRejectedValue(errorNetwork);

    const { result } = renderHook(() => useFetch(peticion, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("No pudimos conectar, revisa tu conexion");
  });

  it("debe usar el mensaje por defecto o del backend en otros errores", async () => {
    const error400 = {
      response: {
        status: 400,
        data: { message: "Solicitud incorrecta" },
      },
    };
    const peticion = jest.fn().mockRejectedValue(error400);

    const { result } = renderHook(() => useFetch(peticion, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Solicitud incorrecta");
  });

  it("debe respetar las opciones personalizadas de mensajes de error", async () => {
    const error404 = { response: { status: 404 } };
    const peticion = jest.fn().mockRejectedValue(error404);

    const { result } = renderHook(() =>
      useFetch(peticion, [], { notFound: "Elemento no encontrado en catálogo" })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Elemento no encontrado en catálogo");
  });

  it("debe permitir actualizar los datos manualmente mediante setData", async () => {
    const peticion = jest.fn().mockResolvedValue(["item1", "item2"]);

    const { result } = renderHook(() => useFetch(peticion, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setData(["item1"]);
    });

    expect(result.current.data).toEqual(["item1"]);
  });
});
