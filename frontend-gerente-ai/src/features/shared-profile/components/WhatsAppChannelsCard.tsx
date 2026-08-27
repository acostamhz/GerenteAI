import { useState } from 'react';
import { MessageSquare, Phone, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';

export function WhatsAppChannelsCard() {
  const [phones, setPhones] = useState([
    { id: 1, number: '+57 300 123 4567', label: 'Canal de Ventas', active: true },
    { id: 2, number: '+57 310 987 6543', label: 'Atención al Cliente', active: true },
  ]);
  const [newNumber, setNewNumber] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const maxLimit = 5;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNumber.trim().length > 6 && phones.length < maxLimit) {
      setPhones([
        ...phones,
        {
          id: Date.now(),
          number: newNumber.trim(),
          label: newLabel.trim() || 'Línea de Operaciones',
          active: true,
        },
      ]);
      setNewNumber('');
      setNewLabel('');
    }
  };

  const handleRemove = (id: number) => {
    setPhones(phones.filter((p) => p.id !== id));
  };

  const percentage = Math.round((phones.length / maxLimit) * 100);

  return (
    <div className="rounded-3xl bg-card/70 backdrop-blur-xl border border-border/80 p-6 sm:p-7 shadow-sm space-y-5">
      {/* Header & Plan Quota Progress */}
      <div className="space-y-3 border-b border-border/60 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              Canales y Líneas de WhatsApp
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Números habilitados para despachar alertas y recibir consultas de clientes.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              {phones.length} de {maxLimit} Líneas Activas
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Add New Line Form */}
      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="tel"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            placeholder="+57 300 000 0000"
            className="w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
          />
        </div>

        <div className="sm:col-span-4">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Etiqueta (ej: Ventas)"
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <Button
            type="submit"
            disabled={phones.length >= maxLimit || newNumber.trim().length < 7}
            className="w-full py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Vincular
          </Button>
        </div>
      </form>

      {/* List of Connected Lines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AnimatePresence>
          {phones.map((phone) => (
            <motion.div
              key={phone.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-border/70 bg-background/50 hover:bg-background/80 transition-all shadow-sm group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h5 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">{phone.number}</h5>
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {phone.label}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(phone.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                title="Desvincular línea"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {phones.length === 0 && (
          <div className="col-span-2 py-8 text-center text-muted-foreground space-y-1">
            <AlertCircle className="w-6 h-6 text-muted-foreground/50 mx-auto" />
            <p className="text-xs font-medium">No hay números de WhatsApp vinculados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
