import { apiClient } from '@/lib/apiClient';
import { AuthUser } from '@/features/auth/types';
import {
  CambiarEmailDto,
  CreateNegocioDto,
  Negocio,
  UpdateNegocioDto,
  UpdateUsuarioDto,
} from '../types';

export const profileApi = {
  /**
   * Obtener perfil del usuario autenticado actual.
   * Llama a GET /auth/usuarios/me (o fallback a los datos locales si no hay endpoint GET dedicado)
   */
  async getMe(): Promise<AuthUser> {
    return apiClient<AuthUser>('/auth/usuarios/me', {
      method: 'GET',
    });
  },

  /**
   * Actualizar datos del usuario (teléfono).
   * Llama a PATCH /auth/usuarios/me
   */
  async updateUsuario(data: UpdateUsuarioDto): Promise<AuthUser> {
    return apiClient<AuthUser>('/auth/usuarios/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Solicitar cambio de correo electrónico.
   * Llama a POST /auth/cambiar-email
   */
  async cambiarEmail(data: CambiarEmailDto): Promise<{ mensaje: string }> {
    return apiClient<{ mensaje: string }>('/auth/cambiar-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Listar todos los negocios.
   * Llama a GET /negocios
   */
  async getNegocios(): Promise<Negocio[]> {
    return apiClient<Negocio[]>('/negocios', {
      method: 'GET',
    });
  },

  /**
   * Obtener detalle de un negocio.
   * Llama a GET /negocios/:id
   */
  async getNegocioById(id: string): Promise<Negocio> {
    return apiClient<Negocio>(`/negocios/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Crear un nuevo negocio.
   * Llama a POST /negocios
   */
  async createNegocio(data: CreateNegocioDto): Promise<Negocio> {
    return apiClient<Negocio>('/negocios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar un negocio.
   * Llama a PATCH /negocios/:id
   */
  async updateNegocio(id: string, data: UpdateNegocioDto): Promise<Negocio> {
    return apiClient<Negocio>(`/negocios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar un negocio.
   * Llama a DELETE /negocios/:id
   */
  async deleteNegocio(id: string): Promise<{ mensaje?: string } | void> {
    return apiClient(`/negocios/${id}`, {
      method: 'DELETE',
    });
  },
};
