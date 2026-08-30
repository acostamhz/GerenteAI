import { apiClient } from '@/lib/apiClient';
import { AuthUser } from '@/features/auth/types';
import {
  CambiarEmailDto,
  CreateNegocioDto,
  CreateSedeDto,
  Negocio,
  Sede,
  UpdateNegocioDto,
  UpdateSedeDto,
  UpdateUsuarioDto,
  UserProfileResponse,
} from '../types';

export const profileApi = {
  /**
   * Obtener perfil completo del usuario autenticado actual con sus negocios y sedes.
   * Llama a GET /auth/usuarios/me
   */
  async getMe(): Promise<UserProfileResponse> {
    return apiClient<UserProfileResponse>('/auth/usuarios/me', {
      method: 'GET',
    });
  },

  /**
   * Actualizar datos personales del usuario (nombre, teléfono).
   * Llama a PATCH /auth/usuarios/me
   */
  async updateUsuario(data: UpdateUsuarioDto): Promise<AuthUser> {
    return apiClient<AuthUser>('/auth/usuarios/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Solicitar cambio de correo electrónico protegido con contraseña.
   * Llama a POST /auth/cambiar-email
   */
  async cambiarEmail(data: CambiarEmailDto): Promise<{ mensaje: string }> {
    return apiClient<{ mensaje: string }>('/auth/cambiar-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Solicitar restablecimiento de contraseña al correo registrado.
   * Llama a POST /auth/forgot-password
   */
  async requestPasswordReset(email: string): Promise<{ mensaje: string }> {
    return apiClient<{ mensaje: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Listar todos los negocios (CRM/Admin).
   * Llama a GET /negocios
   */
  async getNegocios(): Promise<Negocio[]> {
    return apiClient<Negocio[]>('/negocios', {
      method: 'GET',
    });
  },

  /**
   * Obtener detalle de un negocio específico.
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

  /**
   * Listar todas las sedes de un negocio.
   * Llama a GET /sedes?negocioId=:negocioId
   */
  async getSedes(negocioId: string): Promise<Sede[]> {
    return apiClient<Sede[]>(`/sedes?negocioId=${encodeURIComponent(negocioId)}`, {
      method: 'GET',
    });
  },

  /**
   * Obtener detalle de una sede por ID.
   * Llama a GET /sedes/:id
   */
  async getSedeById(id: string): Promise<Sede> {
    return apiClient<Sede>(`/sedes/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Crear una sede asociada a un negocio.
   * Llama a POST /sedes
   */
  async createSede(data: CreateSedeDto): Promise<Sede> {
    return apiClient<Sede>('/sedes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar datos de una sede existente.
   * Llama a PATCH /sedes/:id
   */
  async updateSede(id: string, data: UpdateSedeDto): Promise<Sede> {
    return apiClient<Sede>(`/sedes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar una sede.
   * Llama a DELETE /sedes/:id
   */
  async deleteSede(id: string): Promise<{ mensaje?: string } | void> {
    return apiClient(`/sedes/${id}`, {
      method: 'DELETE',
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
  }): Promise<{ negocio: Negocio; sede: Sede }> {
    // 1. Crear la empresa matriz
    const negocioPayload: CreateNegocioDto = {
      nombre: data.nombre.trim(),
      ...(data.telefonoContacto?.trim() ? { telefonoContacto: data.telefonoContacto.trim() } : {}),
      ...(data.telefonoSecundario?.trim() ? { telefonoSecundario: data.telefonoSecundario.trim() } : {}),
    };
    const negocio = await this.createNegocio(negocioPayload);

    // 2. Crear la sede/sucursal inicial
    const sedePayload: CreateSedeDto = {
      nombre: data.nombreSede.trim() || 'Sede principal',
      negocioId: negocio.id,
      ...(data.direccionSede?.trim() ? { direccion: data.direccionSede.trim() } : {}),
      ...(data.whatsappPhone?.trim() ? { telefono: data.whatsappPhone.trim() } : {}),
      ...(data.whatsappUsername?.trim() ? { whatsappUsername: data.whatsappUsername.trim().replace(/^@/, '') } : {}),
    };
    const sede = await this.createSede(sedePayload);

    return { negocio, sede };
  },
};
