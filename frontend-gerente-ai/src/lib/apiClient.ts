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

function translateErrorMessage(msg: string): string {
  if (!msg || typeof msg !== 'string') return 'Ocurrió un error inesperado.';
  const lower = msg.toLowerCase();

  if (lower.includes('email must be an email')) {
    return 'Debes ingresar un correo electrónico válido.';
  }
  if (
    lower.includes('password must be longer than or equal to 8 characters') ||
    lower.includes('must be longer than or equal to 8')
  ) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (lower.includes('password must match') || lower.includes('password should contain')) {
    return 'La contraseña debe incluir mayúscula, minúscula, número y un carácter especial.';
  }
  if (lower.includes('nombre should not be empty') || lower.includes('nombre must be a string')) {
    return 'El nombre completo es obligatorio.';
  }
  if (lower.includes('whatsappusername solo admite') || lower.includes('whatsappusername')) {
    return 'El usuario de WhatsApp solo admite letras, números, punto, guion y guion bajo (sin @).';
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('err_failed') ||
    lower.includes('bad gateway') ||
    lower.includes('502')
  ) {
    return 'No pudimos conectar con el servidor. Por favor verifica tu conexión o intenta nuevamente en unos momentos.';
  }
  return msg;
}

function formatErrorMessage(data: any, statusText: string, status: number): string {
  if (Array.isArray(data?.message) && data.message.length > 0) {
    const translated = data.message.map((m: string) => translateErrorMessage(m));
    return translated.join(' · ');
  }
  if (typeof data?.message === 'string' && data.message.trim()) {
    return translateErrorMessage(data.message);
  }
  if (data?.error && typeof data.error === 'string') {
    return translateErrorMessage(data.error);
  }
  if (status === 502 || status === 504) {
    return 'El servidor se está iniciando. Por favor intenta de nuevo en unos segundos.';
  }
  return `Error ${status}: ${statusText || 'Ocurrió un problema inesperado'}`;
}

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

  console.log(
    `📡 [API Request] ${options.method || 'GET'} ${url}`,
    options.body ? JSON.parse(options.body as string) : ''
  );

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
      if (
        response.status === 401 &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/register') &&
        !endpoint.includes('/auth/verificar-email') &&
        !endpoint.includes('/auth/forgot-password') &&
        !endpoint.includes('/auth/reset-password')
      ) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_session');
        localStorage.removeItem('session_expires_at');
        localStorage.removeItem('session_login_time');
        window.location.href = '/login';
      }

      const errorMessage = formatErrorMessage(data, response.statusText, response.status);

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
    const rawMsg = (error as Error).message || '';
    const cleanMsg = translateErrorMessage(rawMsg);
    throw new ApiError(
      500,
      cleanMsg.toLowerCase().includes('fetch') || cleanMsg.toLowerCase().includes('failed')
        ? 'No pudimos conectar con el servidor. Por favor verifica tu conexión a internet o intenta en unos momentos.'
        : cleanMsg || 'No pudimos conectar con el servidor.'
    );
  }
}
