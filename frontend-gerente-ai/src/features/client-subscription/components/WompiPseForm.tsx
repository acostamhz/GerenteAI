import React from 'react';
import { Landmark, User, FileText, Mail, Phone, Info } from 'lucide-react';
import { BANCOS_COLOMBIA_PSE } from '../services/wompiService';
import { DatosFacturacion, DatosPse, TipoDocumento, TipoPersonaPse } from '../types';

interface WompiPseFormProps {
  facturacion: DatosFacturacion;
  pse: DatosPse;
  onChangeFacturacion: (field: keyof DatosFacturacion, value: string) => void;
  onChangePse: (field: keyof DatosPse, value: string) => void;
}

export function WompiPseForm({
  facturacion,
  pse,
  onChangeFacturacion,
  onChangePse,
}: WompiPseFormProps) {
  return (
    <div className="space-y-4">
      {/* Banco Selector */}
      <div>
        <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-emerald-500" />
          Institución Financiera / Banco
        </label>
        <select
          value={pse.bancoCodigo}
          onChange={(e) => onChangePse('bancoCodigo', e.target.value)}
          className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
        >
          {BANCOS_COLOMBIA_PSE.map((banco) => (
            <option key={banco.codigo} value={banco.codigo}>
              {banco.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Tipo de Persona (Natural vs Jurídica) */}
      <div>
        <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-emerald-500" />
          Tipo de Persona
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChangePse('tipoPersona', '0')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
              pse.tipoPersona === '0'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Persona Natural
          </button>
          <button
            type="button"
            onClick={() => onChangePse('tipoPersona', '1')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
              pse.tipoPersona === '1'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Persona Jurídica (Empresa)
          </button>
        </div>
      </div>

      {/* Tipo y Número de Documento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            Tipo Doc.
          </label>
          <select
            value={facturacion.tipoDocumento}
            onChange={(e) => onChangeFacturacion('tipoDocumento', e.target.value as TipoDocumento)}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="CC">Cédula (CC)</option>
            <option value="NIT">NIT</option>
            <option value="CE">Cédula Ext. (CE)</option>
            <option value="PPN">Pasaporte</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
            Número de Identificación
          </label>
          <input
            type="text"
            placeholder="Ej. 1020304050"
            value={facturacion.numeroDocumento}
            onChange={(e) => onChangeFacturacion('numeroDocumento', e.target.value.replace(/[^\d]/g, ''))}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Titular y Correo PSE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
            Nombre / Razón Social
          </label>
          <input
            type="text"
            placeholder="Ej. Inversiones Pérez S.A.S"
            value={facturacion.nombreCompleto}
            onChange={(e) => onChangeFacturacion('nombreCompleto', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-emerald-500" />
            Correo Registrado en PSE
          </label>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={facturacion.email}
            onChange={(e) => onChangeFacturacion('email', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 bg-muted/40 border border-border rounded-xl text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <span>
          Al hacer clic en pagar, Wompi te redireccionará de forma segura a la interfaz de tu banco para autorizar el débito en línea.
        </span>
      </div>
    </div>
  );
}
