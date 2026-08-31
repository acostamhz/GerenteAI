import { apiClient } from '@/lib/apiClient';
import { AuthUser } from '@/features/auth/types';

import {
  CambiarEmailDto,
  CreateNegocioDto,
  CreateNegocioConSedeDto,
  CreateSedeDto,
  Negocio,
  Sede,
  UpdateNegocioDto,
  UpdateSedeDto,
  UpdateUsuarioDto,
  UserProfileResponse,
} from '../types';

let cachedGetMePromise: Promise<UserProfileResponse> | null = null;

export const profileApi = {
  /**
   * Obtener perfil completo del usuario autenticado actual
   * con sus negocios y sedes.
   *
   * Llama a GET /auth/usuarios/me con deduplicación de peticiones concurrentes
   */
  async getMe(forceRefresh = false): Promise<UserProfileResponse> {
    if (!forceRefresh && cachedGetMePromise) {
      return cachedGetMePromise;
    }

    cachedGetMePromise = apiClient<UserProfileResponse>('/auth/usuarios/me', {
      method: 'GET',
    }).finally(() => {
      setTimeout(() => {
        cachedGetMePromise = null;
      }, 500);
    });

    return cachedGetMePromise;
  },

  /**
   * Actualizar datos personales del usuario
   * (nombre, teléfono).
   *
   * Llama a PATCH /auth/usuarios/me
   */
  async updateUsuario(
    data: UpdateUsuarioDto,
  ): Promise<AuthUser> {
    return apiClient<AuthUser>('/auth/usuarios/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Solicitar cambio de correo electrónico
   * protegido con contraseña.
   *
   * Llama a POST /auth/cambiar-email
   */
  async cambiarEmail(
    data: CambiarEmailDto,
  ): Promise<{ mensaje: string }> {
    return apiClient<{ mensaje: string }>(
      '/auth/cambiar-email',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
  },

  /**
   * Solicitar restablecimiento de contraseña
   * al correo registrado.
   *
   * Llama a POST /auth/forgot-password
   */
  async requestPasswordReset(
    email: string,
  ): Promise<{ mensaje: string }> {
    return apiClient<{ mensaje: string }>(
      '/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      },
    );
  },

  /**
   * Listar todos los negocios en los que el usuario es dueño/socio.
   *
   * Llama a GET /negocios
   */
  async getNegocios(): Promise<Negocio[]> {
    return apiClient<Negocio[]>('/negocios', {
      method: 'GET',
    });
  },

  /**
   * Obtener detalle de un negocio por ID.
   *
   * Llama a GET /negocios/:id
   */
  async getNegocioById(
    id: string,
  ): Promise<Negocio> {
    return apiClient<Negocio>(
      `/negocios/${id}`,
      {
        method: 'GET',
      },
    );
  },

  /**
   * Crear un nuevo negocio.
   *
   * Llama a POST /negocios
   */
  async createNegocio(
    data: CreateNegocioDto,
  ): Promise<Negocio> {
    return apiClient<Negocio>('/negocios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar información de un negocio existente.
   *
   * Llama a PATCH /negocios/:id
   */
  async updateNegocio(
    id: string,
    data: UpdateNegocioDto,
  ): Promise<Negocio> {
    return apiClient<Negocio>(
      `/negocios/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    );
  },

  /**
   * Eliminar un negocio.
   *
   * Llama a DELETE /negocios/:id
   */
  async deleteNegocio(
    id: string,
  ): Promise<{ mensaje?: string } | void> {
    return apiClient(
      `/negocios/${id}`,
      {
        method: 'DELETE',
      },
    );
  },

  /**
   * Listar todas las sedes de un negocio.
   *
   * Llama a GET /sedes?negocioId=:negocioId
   */
  async getSedes(
    negocioId: string,
  ): Promise<Sede[]> {
    return apiClient<Sede[]>(
      `/sedes?negocioId=${encodeURIComponent(
        negocioId,
      )}`,
      {
        method: 'GET',
      },
    );
  },

  /**
   * Obtener detalle de una sede por ID.
   *
   * Llama a GET /sedes/:id
   */
  async getSedeById(
    id: string,
  ): Promise<Sede> {
    return apiClient<Sede>(
      `/sedes/${id}`,
      {
        method: 'GET',
      },
    );
  },

  /**
   * Crear una sede asociada a un negocio.
   *
   * Llama a POST /sedes
   */
  async createSede(
    data: CreateSedeDto,
  ): Promise<Sede> {
    return apiClient<Sede>('/sedes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar datos de una sede existente.
   *
   * Llama a PATCH /sedes/:id
   */
  async updateSede(
    id: string,
    data: UpdateSedeDto,
  ): Promise<Sede> {
    return apiClient<Sede>(
      `/sedes/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    );
  },

  /**
   * Eliminar una sede.
   *
   * Llama a DELETE /sedes/:id
   */
  async deleteSede(
    id: string,
  ): Promise<{ mensaje?: string } | void> {
    return apiClient(
      `/sedes/${id}`,
      {
        method: 'DELETE',
      },
    );
  },

  /**
   * Orquesta la creación de un negocio y su primera sede.
   *
   * 1. Crea el negocio matriz (El backend crea automáticamente la sede inicial en la transacción).
   * 2. Consulta y actualiza la sede inicial con los datos personalizados provistos por el usuario
   *    sin violar el límite de 1 sede del Plan Asistente (Plan 1).
   */
  async createNegocioConSede(
    data: CreateNegocioConSedeDto,
  ): Promise<{
    negocio: Negocio;
    sede: Sede;
  }> {
    /*
     * ============================================
     * 1. CREAR NEGOCIO MATRIZ
     * ============================================
     */
    const negocioPayload: CreateNegocioDto = {
      nombre: data.nombre.trim(),
      ...(data.telefonoContacto?.trim()
        ? { telefonoContacto: data.telefonoContacto.trim() }
        : {}),
      ...(data.telefonoSecundario?.trim()
        ? { telefonoSecundario: data.telefonoSecundario.trim() }
        : {}),
      ...(data.contexto?.trim()
        ? { contexto: data.contexto.trim() }
        : {}),
    };

    const negocio = await this.createNegocio(negocioPayload);

    /*
     * ============================================
     * 2. OBTENER Y ACTUALIZAR LA SEDE INICIAL
     * ============================================
     */
    let sede: Sede;

    try {
      // El backend en NegociosService.create ya crea la primera sede ('Sede principal')
      const sedesExistentes = await this.getSedes(negocio.id);

      if (sedesExistentes && sedesExistentes.length > 0) {
        const sedeInicial = sedesExistentes[0];

        const updatePayload: UpdateSedeDto = {
          ...(data.nombreSede?.trim() ? { nombre: data.nombreSede.trim() } : {}),
          ...(data.direccionSede?.trim() ? { direccion: data.direccionSede.trim() } : {}),
          ...(data.whatsappPhone?.trim() ? { telefono: data.whatsappPhone.trim() } : {}),
          ...(data.whatsappUsername?.trim()
            ? { whatsappUsername: data.whatsappUsername.trim().replace(/^@+/, '') }
            : {}),
        };

        if (Object.keys(updatePayload).length > 0) {
          sede = await this.updateSede(sedeInicial.id, updatePayload);
        } else {
          sede = sedeInicial;
        }
      } else {
        // Fallback: si por alguna razón no existiera sede inicial
        const sedePayload: CreateSedeDto = {
          nombre: data.nombreSede?.trim() || 'Sede principal',
          negocioId: negocio.id,
          ...(data.direccionSede?.trim() ? { direccion: data.direccionSede.trim() } : {}),
          ...(data.whatsappPhone?.trim() ? { telefono: data.whatsappPhone.trim() } : {}),
          ...(data.whatsappUsername?.trim()
            ? { whatsappUsername: data.whatsappUsername.trim().replace(/^@+/, '') }
            : {}),
        };
        sede = await this.createSede(sedePayload);
      }
    } catch (error) {
      console.warn('⚠️ [createNegocioConSede] Fallback en resolución de sede inicial:', error);
      sede = {
        id: '',
        nombre: data.nombreSede?.trim() || 'Sede principal',
        negocioId: negocio.id,
        telefono: data.whatsappPhone?.trim() || null,
        direccion: data.direccionSede?.trim() || null,
        whatsappUsername: data.whatsappUsername?.trim()?.replace(/^@+/, '') || null,
        createdAt: new Date().toISOString(),
      };
    }

    return {
      negocio,
      sede,
    };
  },
};