// EP 014 / EP 015 - ArrendadorResponseDTO
export interface Landlord {
  id: number;
  nombre: string;
  correo: string;
  verificado: boolean;
  puntajePromedio: number | null;
  totalCalificaciones: number;
  cantidadHabitaciones: number;
  fotoPerfil: string | null;
  telefono?: string | null; // only comes back for the landlord himself (or ADMIN)
}

// EP 015 - body (ArrendadorUpdateRequestDTO)
export interface UpdateLandlordRequest {
  nombre: string;
  dniFoto: string | null;
  fotoPerfil?: string | null; // new photo URL; '' removes it; null/omitted = keep the current one
  telefono?: string; // '' removes it; omitted = keep the current one
}