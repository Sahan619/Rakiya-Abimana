const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface RequestOptions extends RequestInit {
  data?: any;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, headers = {}, ...customConfig } = options;
  const isFormData = data instanceof FormData;

  const config: RequestInit = {
    ...customConfig,
    headers: isFormData
      ? headers
      : {
          "Content-Type": "application/json",
          ...headers
        },
    credentials: "include" // sends httpOnly cookie automatically
  };

  if (data && !isFormData) {
    config.body = JSON.stringify(data);
  } else if (data && isFormData) {
    config.body = data;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = "An unexpected network or server error occurred";
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.error || errorJson.message || errorMessage;
    } catch {
      errorMessage = `Server error (${response.status}: ${response.statusText})`;
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T = any>(endpoint: string, headers?: HeadersInit) =>
    apiRequest<T>(endpoint, { method: "GET", headers }),

  post: <T = any>(endpoint: string, data?: any, headers?: HeadersInit) =>
    apiRequest<T>(endpoint, { method: "POST", data, headers }),

  put: <T = any>(endpoint: string, data?: any, headers?: HeadersInit) =>
    apiRequest<T>(endpoint, { method: "PUT", data, headers }),

  patch: <T = any>(endpoint: string, data?: any, headers?: HeadersInit) =>
    apiRequest<T>(endpoint, { method: "PATCH", data, headers }),

  delete: <T = any>(endpoint: string, headers?: HeadersInit) =>
    apiRequest<T>(endpoint, { method: "DELETE", headers })
};

