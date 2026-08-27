export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  console.log(`📡 [API Request] ${options.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body as string) : '');

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      console.log(`✅ [API Response 204 No Content] ${url}`);
      return {} as T;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.warn(`⚠️ [API Response Error ${response.status}] ${url}:`, data);

      // Si el token es inválido o expiró en una ruta protegida
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_session');
        window.location.href = '/login';
      }

      const errorMessage = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message || `Error ${response.status}: ${response.statusText}`;

      throw new ApiError(
        response.status,
        errorMessage,
        Array.isArray(data.message) ? data.message : undefined
      );
    }

    console.log(`✅ [API Response ${response.status}] ${url}:`, data);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(`🚨 [API Connection Error] ${url}:`, error);
    throw new ApiError(
      500,
      (error as Error).message || 'No se pudo conectar con el servidor. Revisa que el backend esté corriendo en http://localhost:3000.'
    );
  }
}
