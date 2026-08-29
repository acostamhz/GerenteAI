import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { profileApi } from '../api/profileApi';
import { 
  CreateNegocioDto, 
  CreateSedeDto, 
  Negocio, 
  Sede, 
  UpdateNegocioDto, 
  UpdateSedeDto,
  UserProfileResponse
} from '../types';
import { ApiError } from '@/lib/apiClient';

export function useProfileData() {
  const { user: authUser, token } = useAuth();

  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [sedesByNegocio, setSedesByNegocio] = useState<Record<string, Sede[]>>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [isLoadingNegocios, setIsLoadingNegocios] = useState<boolean>(true);
  const [isLoadingSedes, setIsLoadingSedes] = useState<boolean>(false);
  const [isSavingUser, setIsSavingUser] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Cargar perfil completo real y filtrar exclusivamente sus negocios propios
  const fetchProfileAndBusinesses = useCallback(async () => {
    if (!token) {
      setIsLoadingProfile(false);
      setIsLoadingNegocios(false);
      return;
    }

    setIsLoadingProfile(true);
    setIsLoadingNegocios(true);
    setIsLoadingSedes(true);
    setActionError(null);

    try {
      // 1. Obtener perfil real del usuario con sus relaciones
      const profileData = await profileApi.getMe();
      setUserProfile(profileData);

      // 2. Extraer ÚNICAMENTE los negocios asignados a este usuario
      const userBusinessesList = profileData.negocios?.map((item) => item.negocio) || [];

      if (userBusinessesList.length > 0) {
        // Cargar detalles completos y sedes de cada negocio del usuario en paralelo
        const businessesPromises = userBusinessesList.map(async (item) => {
          try {
            const [negocioDetail, sedes] = await Promise.all([
              profileApi.getNegocioById(item.id).catch(() => ({
                id: item.id,
                nombre: item.nombre,
                telefono: item.telefono || '',
                telefonoSecundario: item.telefonoSecundario || null,
                contexto: item.contexto || null,
              })),
              profileApi.getSedes(item.id).catch(() => []),
            ]);

            return {
              negocio: negocioDetail as Negocio,
              sedes: Array.isArray(sedes) ? sedes : [],
            };
          } catch {
            return {
              negocio: {
                id: item.id,
                nombre: item.nombre,
                telefono: '',
              } as Negocio,
              sedes: [],
            };
          }
        });

        const results = await Promise.all(businessesPromises);
        const listaNegocios = results.map((r) => r.negocio);
        const mapSedes: Record<string, Sede[]> = {};
        results.forEach((r) => {
          mapSedes[r.negocio.id] = r.sedes;
        });

        setNegocios(listaNegocios);
        setSedesByNegocio(mapSedes);
      } else {
        setNegocios([]);
        setSedesByNegocio({});
      }
    } catch (err) {
      console.error('Error al cargar perfil y negocios del usuario:', err);
      // Fallback a datos de sesión si falla la red
      if (authUser) {
        setUserProfile({
          id: authUser.id,
          nombre: authUser.nombre,
          email: authUser.email || '',
          telefono: authUser.telefono,
          emailVerificado: authUser.emailVerificado || false,
          rolGlobal: authUser.rolGlobal || 'CLIENTE',
          plan: authUser.plan,
          createdAt: authUser.createdAt,
        });
      }
    } finally {
      setIsLoadingProfile(false);
      setIsLoadingNegocios(false);
      setIsLoadingSedes(false);
    }
  }, [token, authUser]);

  useEffect(() => {
    fetchProfileAndBusinesses();
  }, [fetchProfileAndBusinesses]);

  // Actualizar datos personales (Nombre y Celular)
  const updatePersonalData = async (data: { nombre?: string; telefono?: string }) => {
    setIsSavingUser(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updated = await profileApi.updateUsuario(data);
      
      setUserProfile((prev) => (prev ? { ...prev, ...updated } : null));

      // Sincronizar sesión local
      const currentSession = localStorage.getItem('user_session');
      if (currentSession) {
        try {
          const parsed = JSON.parse(currentSession);
          const newSession = { ...parsed, ...updated };
          localStorage.setItem('user_session', JSON.stringify(newSession));
        } catch {
          // Ignorar fallo de parseo
        }
      }

      window.dispatchEvent(new Event('user_profile_updated'));
      setActionSuccess('Datos personales actualizados correctamente.');
      return true;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al actualizar tus datos personales';
      setActionError(msg);
      return false;
    } finally {
      setIsSavingUser(false);
    }
  };

  // Solicitar cambio de correo electrónico protegido con contraseña
  const requestEmailChange = async (password: string, nuevoEmail: string) => {
    setIsSavingUser(true);
    try {
      await profileApi.cambiarEmail({ password, nuevoEmail });
      return true;
    } catch (err) {
      return false;
    } finally {
      setIsSavingUser(false);
    }
  };

  // Solicitar restablecimiento de contraseña al correo registrado
  const requestPasswordReset = async () => {
    const email = userProfile?.email || authUser?.email;
    if (!email) {
      return false;
    }

    setIsSavingUser(true);
    try {
      await profileApi.requestPasswordReset(email);
      return true;
    } catch (err) {
      return false;
    } finally {
      setIsSavingUser(false);
    }
  };

  // ==========================================
  // OPERACIONES DE NEGOCIOS (CRUD)
  // ==========================================

  // 1. Crear nuevo negocio con su sede inicial
  const createNegocio = async (dto: CreateNegocioDto & { nombreSede?: string; direccionSede?: string; whatsappPhone?: string; whatsappUsername?: string }) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const { negocio, sede } = await profileApi.createNegocioConSede({
        nombre: dto.nombre,
        telefonoContacto: dto.telefonoContacto || undefined,
        telefonoSecundario: dto.telefonoSecundario || undefined,
        nombreSede: dto.nombreSede || 'Sede Principal',
        direccionSede: dto.direccionSede || undefined,
        whatsappPhone: dto.whatsappPhone || dto.telefono || undefined,
        whatsappUsername: dto.whatsappUsername || undefined,
      });

      setNegocios((prev) => [negocio, ...prev]);
      if (sede?.id) {
        setSedesByNegocio((prev) => ({
          ...prev,
          [negocio.id]: [sede],
        }));
        localStorage.setItem('active_sede_id', sede.id);
        localStorage.setItem('active_sede_name', sede.nombre || dto.nombreSede || 'Sede Principal');
      }

      localStorage.setItem('active_business_id', negocio.id);
      localStorage.setItem('active_business_name', negocio.nombre);
      window.dispatchEvent(new Event('business_changed'));
      window.dispatchEvent(new Event('sede_changed'));
      setActionSuccess(`Negocio "${negocio.nombre}" registrado exitosamente.`);
      return negocio;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al crear el negocio';
      setActionError(msg);
      throw err;
    }
  };

  // 2. Actualizar negocio existente
  const updateNegocio = async (id: string, dto: UpdateNegocioDto) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const actualizado = await profileApi.updateNegocio(id, dto);
      setNegocios((prev) => prev.map((n) => (n.id === id ? { ...n, ...actualizado } : n)));
      
      const activeBusinessId = localStorage.getItem('active_business_id');
      if (activeBusinessId === id && dto.nombre) {
        localStorage.setItem('active_business_name', dto.nombre);
        window.dispatchEvent(new Event('business_changed'));
      }

      setActionSuccess(`Negocio "${actualizado.nombre}" actualizado.`);
      return actualizado;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al actualizar el negocio';
      setActionError(msg);
      throw err;
    }
  };

  // 3. Eliminar negocio
  const deleteNegocio = async (id: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await profileApi.deleteNegocio(id);
      const listaRestante = negocios.filter((n) => n.id !== id);
      setNegocios(listaRestante);
      
      setSedesByNegocio((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      const activeBusinessId = localStorage.getItem('active_business_id');
      if (activeBusinessId === id) {
        if (listaRestante.length > 0) {
          const siguiente = listaRestante[0];
          localStorage.setItem('active_business_id', siguiente.id);
          localStorage.setItem('active_business_name', siguiente.nombre);
        } else {
          localStorage.removeItem('active_business_id');
          localStorage.removeItem('active_business_name');
          localStorage.removeItem('active_sede_id');
          localStorage.removeItem('active_sede_name');
        }
        window.dispatchEvent(new Event('business_changed'));
        window.dispatchEvent(new Event('sede_changed'));
      }

      setActionSuccess('Negocio eliminado correctamente.');
      return true;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo eliminar el negocio';
      setActionError(msg);
      throw err;
    }
  };

  // ==========================================
  // OPERACIONES DE SEDES (CRUD)
  // ==========================================

  // 1. Crear sede
  const createSede = async (negocioId: string, dto: Omit<CreateSedeDto, 'negocioId'>) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const payload: CreateSedeDto = {
        ...dto,
        negocioId,
        nombre: dto.nombre.trim(),
        telefono: dto.telefono?.trim() || undefined,
        whatsappUsername: dto.whatsappUsername?.trim()?.replace(/^@/, '') || undefined,
        direccion: dto.direccion?.trim() || undefined,
      };

      const nuevaSede = await profileApi.createSede(payload);
      
      setSedesByNegocio((prev) => ({
        ...prev,
        [negocioId]: [...(prev[negocioId] || []), nuevaSede],
      }));

      window.dispatchEvent(new Event('sede_changed'));
      setActionSuccess(`Sede "${nuevaSede.nombre}" creada con éxito.`);
      return nuevaSede;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al crear la sede';
      setActionError(msg);
      throw err;
    }
  };

  // 2. Actualizar sede
  const updateSede = async (sedeId: string, negocioId: string, dto: UpdateSedeDto) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const payload: UpdateSedeDto = {
        ...dto,
        ...(dto.nombre ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.telefono ? { telefono: dto.telefono.trim() } : {}),
        ...(dto.whatsappUsername ? { whatsappUsername: dto.whatsappUsername.trim().replace(/^@/, '') } : {}),
        ...(dto.direccion ? { direccion: dto.direccion.trim() } : {}),
      };

      const actualizada = await profileApi.updateSede(sedeId, payload);

      setSedesByNegocio((prev) => ({
        ...prev,
        [negocioId]: (prev[negocioId] || []).map((s) => (s.id === sedeId ? { ...s, ...actualizada } : s)),
      }));

      const activeSedeId = localStorage.getItem('active_sede_id');
      if (activeSedeId === sedeId && dto.nombre) {
        localStorage.setItem('active_sede_name', dto.nombre);
        window.dispatchEvent(new Event('sede_changed'));
      }

      setActionSuccess(`Sede "${actualizada.nombre}" actualizada.`);
      return actualizada;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al actualizar la sede';
      setActionError(msg);
      throw err;
    }
  };

  // 3. Eliminar sede
  const deleteSede = async (sedeId: string, negocioId: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await profileApi.deleteSede(sedeId);

      setSedesByNegocio((prev) => {
        const sedesRestantes = (prev[negocioId] || []).filter((s) => s.id !== sedeId);
        
        const activeSedeId = localStorage.getItem('active_sede_id');
        if (activeSedeId === sedeId) {
          if (sedesRestantes.length > 0) {
            localStorage.setItem('active_sede_id', sedesRestantes[0].id);
            localStorage.setItem('active_sede_name', sedesRestantes[0].nombre);
          } else {
            localStorage.removeItem('active_sede_id');
            localStorage.removeItem('active_sede_name');
          }
          window.dispatchEvent(new Event('sede_changed'));
        }

        return {
          ...prev,
          [negocioId]: sedesRestantes,
        };
      });

      setActionSuccess('Sede eliminada correctamente.');
      return true;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo eliminar la sede';
      setActionError(msg);
      throw err;
    }
  };

  const clearFeedback = () => {
    setActionError(null);
    setActionSuccess(null);
  };

  return {
    user: userProfile || authUser,
    userProfile,
    negocios,
    sedesByNegocio,
    isLoadingProfile,
    isLoadingNegocios,
    isLoadingSedes,
    isSavingUser,
    actionError,
    actionSuccess,
    updatePersonalData,
    requestEmailChange,
    requestPasswordReset,
    createNegocio,
    updateNegocio,
    deleteNegocio,
    createSede,
    updateSede,
    deleteSede,
    fetchSedes: async (negocioId: string) => {
      const data = await profileApi.getSedes(negocioId);
      const lista = Array.isArray(data) ? data : [];
      setSedesByNegocio((prev) => ({ ...prev, [negocioId]: lista }));
      return lista;
    },
    refreshProfile: fetchProfileAndBusinesses,
    clearFeedback,
  };
}
