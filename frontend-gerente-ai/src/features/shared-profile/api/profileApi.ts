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
   * Listar todas las sedes de un negocio.
   * Llama a GET /sedes?negocioId=...
   */
  async getSedes(negocioId: string): Promise<any[]> {
    return apiClient<any[]>(`/sedes?negocioId=${negocioId}`, {
      method: 'GET',
    });
  },

  /**
   * Crear una sede asociada a un negocio.
   * Llama a POST /sedes
   */
  async createSede(data: {
    nombre: string;
    negocioId: string;
    telefono?: string;
    whatsappUsername?: string;
    direccion?: string;
  }): Promise<any> {
    return apiClient('/sedes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Orquesta la creación de una empresa matriz y su primera sede/sucursal.
   */
  async createNegocioConSede(data: {
    nombre: string;
    telefonoContacto?: string;
    telefonoSecundario?: string;
    nombreSede: string;
    direccionSede?: string;
    whatsappPhone?: string;
    whatsappUsername?: string;
  }): Promise<{ negocio: Negocio; sede: any }> {
    // 1. Crear la empresa matriz
    const negocioPayload: CreateNegocioDto = {
      nombre: data.nombre.trim(),
      ...(data.telefonoContacto?.trim() ? { telefonoContacto: data.telefonoContacto.trim() } : {}),
      ...(data.telefonoSecundario?.trim() ? { telefonoSecundario: data.telefonoSecundario.trim() } : {}),
    };
    const negocio = await this.createNegocio(negocioPayload);

    // 2. Crear la sede/sucursal inicial
    const sedePayload = {
      nombre: data.nombreSede.trim() || 'Sede Principal',
      negocioId: negocio.id,
      ...(data.direccionSede?.trim() ? { direccion: data.direccionSede.trim() } : {}),
      ...(data.whatsappPhone?.trim() ? { telefono: data.whatsappPhone.trim() } : {}),
      ...(data.whatsappUsername?.trim() ? { whatsappUsername: data.whatsappUsername.trim().replace(/^@/, '') } : {}),
    };
    const sede = await this.createSede(sedePayload);

    return { negocio, sede };
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
