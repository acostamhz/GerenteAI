import { apiClient } from '@/lib/apiClient';
import {
  AuthResponse,
  AuthUser,
  BackendAuthResponse,
  ForgotPasswordCredentials,
  LoginCredentials,
  RegisterCredentials,
  ResendVerificationResponse,
  ResetPasswordCredentials,
  VerifyEmailResponse,
} from '../types';

export const authApi = {
  /**
   * Iniciar sesión con email y password.
   * Normaliza la respuesta del backend (accessToken / usuario).
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const raw = await apiClient<BackendAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    const token = raw.accessToken || raw.access_token || '';
    const user = raw.usuario || raw.user || {
      id: '',
      nombre: '',
      rolGlobal: 'CLIENTE',
    };

    return {
      access_token: token,
      user,
    };
  },

  /**
   * Registro de nuevo usuario.
   */
  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    const raw = await apiClient<BackendAuthResponse | AuthUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if ('usuario' in raw && raw.usuario) return raw.usuario;
    if ('user' in raw && raw.user) return raw.user;
    return raw as AuthUser;
  },

  /**
   * Obtener perfil del usuario autenticado actual.
   * Requiere token JWT.
   */
  async getMe(): Promise<AuthUser> {
    return apiClient<AuthUser>('/auth/usuarios/me', {
      method: 'GET',
    });
  },

  /**
   * Verificar correo electrónico mediante token recibido por email.
   * Llama a GET /auth/verificar-email?token=...
   */
  async verificarEmail(token: string): Promise<VerifyEmailResponse> {
    return apiClient<VerifyEmailResponse>(`/auth/verificar-email?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });
  },

  /**
   * Reenviar correo de verificación.
   * Llama a POST /auth/reenviar-verificacion con { email }
   */
  async reenviarVerificacion(email: string): Promise<ResendVerificationResponse> {
    return apiClient<ResendVerificationResponse>('/auth/reenviar-verificacion', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Solicitar correo de recuperación de contraseña.
   */
  async forgotPassword(data: ForgotPasswordCredentials): Promise<{ mensaje: string }> {
    return apiClient<{ mensaje: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Restablecer contraseña con token.
   */
  async resetPassword(data: ResetPasswordCredentials): Promise<{ mensaje: string }> {
    return apiClient<{ mensaje: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
