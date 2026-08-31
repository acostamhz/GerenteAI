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
   *
   * Normaliza la respuesta del backend y sanitiza email.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const payload = {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    };

    const raw = await apiClient<BackendAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const token = raw.accessToken || raw.access_token || '';

    const user = raw.usuario ||
      raw.user || {
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
   * Registrar un nuevo usuario.
   *
   * El backend NO devuelve accessToken en el registro porque requiere
   * activación previa mediante el correo de verificación.
   */
  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    const cleanUsername = credentials.whatsappUsername
      ? credentials.whatsappUsername.trim().replace(/^@+/, '')
      : undefined;

    const payload = {
      nombre: credentials.nombre.trim(),
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
      ...(credentials.telefono?.trim() ? { telefono: credentials.telefono.trim() } : {}),
      nombreNegocio: credentials.nombreNegocio?.trim() || `Negocio de ${credentials.nombre.trim()}`,
      ...(cleanUsername ? { whatsappUsername: cleanUsername } : {}),
    };

    const raw = await apiClient<BackendAuthResponse | AuthUser>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );

    if ('usuario' in raw && raw.usuario) {
      return raw.usuario;
    }

    if ('user' in raw && raw.user) {
      return raw.user;
    }

    return raw as AuthUser;
  },

  /**
   * Obtener perfil del usuario autenticado actual.
   *
   * Requiere token JWT.
   */
  async getMe(): Promise<AuthUser> {
    return apiClient<AuthUser>('/auth/usuarios/me', {
      method: 'GET',
    });
  },

  /**
   * Verificar correo electrónico mediante el token
   * recibido por email.
   *
   * GET /auth/verificar-email?token=...
   */
  async verificarEmail(token: string): Promise<VerifyEmailResponse> {
    return apiClient<VerifyEmailResponse>(
      `/auth/verificar-email?token=${encodeURIComponent(token.trim())}`,
      {
        method: 'GET',
      },
    );
  },

  /**
   * Reenviar correo de verificación.
   *
   * POST /auth/reenviar-verificacion
   */
  async reenviarVerificacion(
    email: string,
  ): Promise<ResendVerificationResponse> {
    return apiClient<ResendVerificationResponse>(
      '/auth/reenviar-verificacion',
      {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      },
    );
  },

  /**
   * Solicitar correo de recuperación de contraseña.
   *
   * POST /auth/forgot-password
   */
  async forgotPassword(
    data: ForgotPasswordCredentials,
  ): Promise<{ mensaje: string }> {
    return apiClient<{ mensaje: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: data.email.trim().toLowerCase() }),
    });
  },

  /**
   * Restablecer contraseña con token.
   *
   * POST /auth/reset-password
   */
  async resetPassword(
    data: ResetPasswordCredentials,
  ): Promise<{ mensaje: string }> {
    return apiClient<{ mensaje: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: data.token.trim(),
        newPassword: data.newPassword,
      }),
    });
  },
};