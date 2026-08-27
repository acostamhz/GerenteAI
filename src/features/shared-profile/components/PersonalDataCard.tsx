import { useState, useRef } from "react";
import { Camera, Upload, Mail, User, Briefcase, Loader2 } from "lucide-react";

export function PersonalDataCard({ isAdmin }: { isAdmin: boolean }) {
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatar, setAvatar] = useState<string>("https://ui-avatars.com/api/?name=José+Meza&background=10b981&color=fff&size=256");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // ponytail: TODO - Conectar con backend real para subida de fotos y guardarlo en el perfil (deuda técnica).
      // Simulating network delay
      setTimeout(() => {
        const objectUrl = URL.createObjectURL(file);
        setAvatar(objectUrl);
        setIsUploading(false);
      }, 1500);
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm flex flex-col h-full relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />

      <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2 relative z-10">
        <User className="w-5 h-5 text-emerald-500" />
        Perfil Personal
      </h2>

      <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div 
            className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-md cursor-pointer group"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <img 
              src={avatar} 
              alt="Profile" 
              className={`w-full h-full object-cover transition-all duration-300 ${isHovering || isUploading ? 'brightness-50 scale-105' : ''}`}
            />
            
            <div className={`absolute inset-0 flex flex-col items-center justify-center text-white transition-opacity duration-300 ${isHovering || isUploading ? 'opacity-100' : 'opacity-0'}`}>
              {isUploading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Cambiar</span>
                </>
              )}
            </div>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Form Section */}
        <div className="flex-1 space-y-4 w-full">
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Nombre Completo
            </label>
            <input 
              type="text" 
              defaultValue="José Meza"
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Correo Electrónico
            </label>
            <input 
              type="email" 
              defaultValue="jose.meza@example.com"
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Rol de Cuenta
            </label>
            <div className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-foreground flex items-center justify-between">
              {isAdmin ? 'Administrador Global' : 'Cliente Corporativo'}
              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${isAdmin ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                Activo
              </span>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition-colors text-sm">
              <Upload className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
