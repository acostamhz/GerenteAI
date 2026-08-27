export interface Negocio {
  id: string;
  nombre: string;
  telefono: string;
  telefonoSecundario?: string | null;
  contexto?: string | null;
  createdAt?: string;
  updatedAt?: string;
  role?: string; // Role of current user in this business (e.g. 'ADMIN', 'OPERADOR')
  active?: boolean;
}

export interface CreateNegocioDto {
  nombre: string;
  telefonoContacto?: string;
  telefono?: string;
  telefonoSecundario?: string;
  contexto?: string;
}

export interface UpdateNegocioDto {
  nombre?: string;
  telefono?: string;
  telefonoSecundario?: string;
  contexto?: string;
}

export interface UpdateUsuarioDto {
  telefono?: string;
}

export interface CambiarEmailDto {
  password: string;
  nuevoEmail: string;
}

export interface PhoneEntry {
  id: string | number;
  number: string;
  active: boolean;
}
