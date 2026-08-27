import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { 
  MailCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Send, 
  RefreshCw,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { authApi } from '../api/authApi';
import { ApiError } from '@/lib/apiClient';

type VerificationStatus = 'idle' | 'loading' | 'success' | 'error';

export function VerifyEmailCard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Estado para reenvío de correo
  const [resendEmail, setResendEmail] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  // Ejecutar verificación al pulsar el botón
  const handleVerify = async () => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No se encontró ningún token de verificación en el enlace.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await authApi.verificarEmail(token);
      setStatus('success');
      setMessage(response.mensaje || '¡Correo verificado correctamente!');
    } catch (err) {
      setStatus('error');
      const msg = err instanceof ApiError ? err.message : 'El enlace de verificación es inválido o ha expirado.';
      setErrorMessage(msg);
    }
  };

  // Reenviar correo de verificación
  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setIsResending(true);
    setResendSuccess(null);
    setResendError(null);

    try {
      const res = await authApi.reenviarVerificacion(resendEmail);
      setResendSuccess(res.mensaje || 'Correo de verificación reenviado. Revisa tu bandeja de entrada.');
      setResendEmail('');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo reenviar el correo. Verifica que el email sea correcto.';
      setResendError(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-6 sm:px-0 py-8">
      {/* ------------------------------------------------------------- */}
      {/* ESTADO 1: LISTO PARA VERIFICAR (Con Token en URL) */}
      {/* ------------------------------------------------------------- */}
      {status === 'idle' && token && (
        <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <MailCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              ✓
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black text-foreground tracking-tight">Verifica tu cuenta</h1>
            <p className="text-muted-foreground font-medium text-sm leading-relaxed max-w-sm mx-auto">
              Estás a un solo paso de activar tu asistente inteligente con IA para tu negocio.
            </p>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleVerify}
              className="w-full py-6 text-base font-bold rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 mr-2" />
              Verificar mi correo
            </Button>
          </div>

          <p className="text-xs text-muted-foreground font-medium">
            Este enlace es seguro y tiene una vigencia de 24 horas.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ESTADO 2: CARGANDO */}
      {/* ------------------------------------------------------------- */}
      {status === 'loading' && (
        <div className="text-center space-y-6 py-8 animate-in fade-in duration-300">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-foreground tracking-tight">Validando tu token...</h2>
            <p className="text-muted-foreground text-sm font-medium">
              Estamos activando tu cuenta en el servidor. Por favor espera un momento.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ESTADO 3: ÉXITO */}
      {/* ------------------------------------------------------------- */}
      {status === 'success' && (
        <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-foreground tracking-tight">¡Cuenta activada!</h2>
            <p className="text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-4 rounded-xl text-sm font-semibold inline-block">
              {message}
            </p>
            <p className="text-muted-foreground text-sm font-medium pt-1">
              Tu correo ha sido confirmado correctamente. Ya puedes ingresar con tus credenciales.
            </p>
          </div>

          <div className="pt-4">
            <Button
              onClick={() => navigate('/login')}
              className="w-full py-6 text-base font-bold rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/20 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Iniciar sesión en la plataforma
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ESTADO 4: ERROR / TOKEN EXPIRADO / SIN TOKEN */}
      {/* ------------------------------------------------------------- */}
      {(status === 'error' || (!token && status === 'idle')) && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shadow-lg shadow-destructive/10">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {status === 'error' ? 'Enlace inválido o expirado' : 'Verificación de Correo'}
            </h2>
            <p className="text-muted-foreground text-sm font-medium">
              {errorMessage || 'El enlace que utilizaste no es válido o ha expirado (válido por 24 horas).'}
            </p>
          </div>

          {/* Formulario para solicitar reenvío de correo */}
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">¿Necesitas un nuevo enlace?</h3>
              <p className="text-xs text-muted-foreground font-medium">
                Ingresa tu correo registrado para enviarte un enlace de verificación actualizado:
              </p>
            </div>

            {resendSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{resendSuccess}</span>
              </div>
            )}

            {resendError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{resendError}</span>
              </div>
            )}

            <form onSubmit={handleResend} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="tu@empresa.com"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium shadow-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={isResending || !resendEmail}
                className="w-full py-4 text-sm font-bold rounded-xl shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando correo...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Reenviar correo de verificación
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
