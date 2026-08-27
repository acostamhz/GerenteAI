import { useState } from 'react';
import { Phone, Plus, Trash2, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';

export function ApprovedPhonesCard({ isAdmin }: { isAdmin?: boolean }) {
  const [phones, setPhones] = useState([
    { id: 1, number: '+57 300 123 4567', active: true, label: 'Línea de Ventas' },
    { id: 2, number: '+57 310 987 6543', active: true, label: 'Soporte y Atención' },
  ]);
  const [newPhone, setNewPhone] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const limit = 5;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPhone.trim().length > 6 && phones.length < limit) {
      setPhones([
        ...phones,
        {
          id: Date.now(),
          number: newPhone.trim(),
          label: newLabel.trim() || 'Línea WhatsApp',
          active: true,
        },
      ]);
      setNewPhone('');
      setNewLabel('');
    }
  };

  const handleRemove = (id: number) => {
    setPhones(phones.filter((p) => p.id !== id));
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            Líneas y Canales de WhatsApp
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Números autorizados para interactuar y recibir reportes del Chatbot de IA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 rounded-full">
            {phones.length} / {limit} Líneas Activas
          </span>
        </div>
      </div>

      {/* Formulario para agregar línea */}
      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="+57 300 000 0000"
            className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
          />
        </div>

        <div className="sm:col-span-4">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Etiqueta (ej: Ventas)"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <Button
            type="submit"
            disabled={phones.length >= limit || newPhone.trim().length < 7}
            className="w-full py-3.5 rounded-xl font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Vincular
          </Button>
        </div>
      </form>

      {/* Lista de Teléfonos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
        <AnimatePresence>
          {phones.map((phone) => (
            <motion.div
              key={phone.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-background/50 hover:bg-background transition-all shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground tracking-tight">{phone.number}</h4>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {phone.label}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(phone.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                title="Desvincular línea"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {phones.length === 0 && (
          <div className="col-span-2 py-10 text-center text-muted-foreground space-y-2">
            <AlertCircle className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p className="text-sm font-medium">No hay números de WhatsApp vinculados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
