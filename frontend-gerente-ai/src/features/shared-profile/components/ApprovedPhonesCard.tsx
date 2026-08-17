import { useState } from "react";
import { Phone, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

export function ApprovedPhonesCard({ isAdmin }: { isAdmin: boolean }) {
  const [phones, setPhones] = useState([
    { id: 1, number: "+57 300 123 4567", active: true },
    { id: 2, number: "+57 310 987 6543", active: true }
  ]);
  const [newPhone, setNewPhone] = useState("");
  const limit = 5;

  const handleAdd = () => {
    if (newPhone.trim().length > 6 && phones.length < limit) {
      setPhones([...phones, { id: Date.now(), number: newPhone, active: true }]);
      setNewPhone("");
    }
  };

  const handleRemove = (id: number) => {
    setPhones(phones.filter(p => p.id !== id));
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-500" />
            Números de WhatsApp
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Autorizados para interactuar con el Chatbot</p>
        </div>
        {!isAdmin && (
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {phones.length} / {limit} Usados
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 text-right max-w-[120px]">
              Límite según tu plan actual
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <input 
          type="tel" 
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          placeholder="+57 300 000 0000"
          className="flex-1 bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
        <button 
          onClick={handleAdd}
          disabled={phones.length >= limit || newPhone.trim().length < 7}
          className="flex items-center justify-center w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {phones.map((phone) => (
          <div key={phone.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10 hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm font-bold text-foreground">{phone.number}</span>
            </div>
            <button 
              onClick={() => handleRemove(phone.id)}
              className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {phones.length === 0 && (
          <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
            <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
            <p className="text-xs font-medium text-center">No hay números registrados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
