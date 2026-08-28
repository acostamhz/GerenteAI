import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { profileApi } from '../api/profileApi';
import { CreateNegocioDto, Negocio, UpdateNegocioDto } from '../types';
import { ApiError } from '@/lib/apiClient';

export function useProfileData() {
  const { user, token } = useAuth();

  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [isLoadingNegocios, setIsLoadingNegocios] = useState<boolean>(true);
  const [isSavingUser, setIsSavingUser] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Cargar lista de negocios desde el backend
  const fetchNegocios = useCallback(async () => {
    if (!token) return;
    setIsLoadingNegocios(true);
    setActionError(null);

    try {
      const data = await profileApi.getNegocios();
      setNegocios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar negocios:', err);
      // Si la lista falla, mantenemos un arreglo vacío sin romper la app
      setNegocios([]);
    } finally {
      setIsLoadingNegocios(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNegocios();
  }, [fetchNegocios]);

  // Actualizar teléfono del usuario
  const updateTelefono = async (telefono: string) => {
    setIsSavingUser(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await profileApi.updateUsuario({ telefono });
      // Actualizar sesión local
      if (user) {
        const updatedUser = { ...user, telefono };
        localStorage.setItem('user_session', JSON.stringify(updatedUser));
      }
      setActionSuccess('Teléfono actualizado correctamente');
      return true;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al actualizar el teléfono';
      setActionError(msg);
      return false;
    } finally {
      setIsSavingUser(false);
    }
  };

  // Solicitar cambio de correo electrónico
  const requestEmailChange = async (password: string, nuevoEmail: string) => {
    setIsSavingUser(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await profileApi.cambiarEmail({ password, nuevoEmail });
      setActionSuccess(res.mensaje || 'Enviamos un correo de confirmación a tu nueva dirección.');
      return true;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al solicitar el cambio de correo.';
      setActionError(msg);
      return false;
    } finally {
      setIsSavingUser(false);
    }
  };

  // Crear un nuevo negocio con su sede inicial
  const createNegocio = async (dto: any) => {
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
        localStorage.setItem('active_sede_id', sede.id);
        localStorage.setItem('active_sede_name', sede.nombre || dto.nombreSede || 'Sede Principal');
      }
      localStorage.setItem('active_business_id', negocio.id);
      localStorage.setItem('active_business_name', negocio.nombre);
      window.dispatchEvent(new Event('business_changed'));
      window.dispatchEvent(new Event('sede_changed'));
      setActionSuccess(`Empresa "${negocio.nombre}" creada exitosamente con su sede.`);
      return negocio;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al crear el negocio';
      setActionError(msg);
      throw err;
    }
  };

  // Actualizar un negocio existente
  const updateNegocio = async (id: string, dto: UpdateNegocioDto) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const actualizado = await profileApi.updateNegocio(id, dto);
      setNegocios((prev) => prev.map((n) => (n.id === id ? { ...n, ...actualizado } : n)));
      setActionSuccess('Negocio actualizado correctamente');
      return actualizado;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al actualizar el negocio';
      setActionError(msg);
      throw err;
    }
  };

  // Eliminar un negocio
  const deleteNegocio = async (id: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await profileApi.deleteNegocio(id);
      setNegocios((prev) => prev.filter((n) => n.id !== id));
      setActionSuccess('Negocio eliminado correctamente');
      return true;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo eliminar el negocio';
      setActionError(msg);
      throw err;
    }
  };

  const clearFeedback = () => {
    setActionError(null);
    setActionSuccess(null);
  };

  return {
    user,
    negocios,
    isLoadingNegocios,
    isSavingUser,
    actionError,
    actionSuccess,
    updateTelefono,
    requestEmailChange,
    createNegocio,
    updateNegocio,
    deleteNegocio,
    refreshNegocios: fetchNegocios,
    clearFeedback,
  };
}
