import { useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { IdentityHeroCard } from './components/IdentityHeroCard';
import { SecurityPasswordCard } from './components/SecurityPasswordCard';
import { BusinessBentoGrid } from './components/BusinessBentoGrid';
import { WhatsAppChannelsCard } from './components/WhatsAppChannelsCard';
import { useProfileData } from './hooks/useProfileData';

export function ProfileView({ isAdmin: _isAdmin }: { isAdmin?: boolean } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAction = searchParams.get('action');
  const targetBusinessId = searchParams.get('businessId');

  const {
    user,
    negocios,
    sedesByNegocio,
    isLoadingProfile,
    isLoadingNegocios,
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
    clearFeedback,
  } = useProfileData();

  const handleClearActionParam = () => {
    if (searchParams.has('action') || searchParams.has('businessId') || searchParams.has('tab')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      newParams.delete('businessId');
      setSearchParams(newParams, { replace: true });
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Encabezado de Página */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Centro de Perfil & Negocios
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Administra tu identidad, organizaciones conectadas y canales autónomos de Inteligencia Artificial.
          </p>
        </div>
      </div>

      {/* Bento Grid Continuo (Alternativa A) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* Columna Izquierda (1/3 Ancho - Identidad, Datos Personales & Seguridad) */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
          <IdentityHeroCard 
            user={user} 
            isLoading={isLoadingProfile}
            isSavingUser={isSavingUser}
            actionError={actionError}
            actionSuccess={actionSuccess}
            onUpdatePersonalData={updatePersonalData}
            onClearFeedback={clearFeedback}
          />
          
          <SecurityPasswordCard
            userEmail={user?.email}
            isLoading={isLoadingProfile}
            isSavingUser={isSavingUser}
            onRequestEmailChange={requestEmailChange}
            onRequestPasswordReset={requestPasswordReset}
          />
        </div>

        {/* Columna Derecha (2/3 Ancho - Negocios, Sedes y Canales WhatsApp) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Negocios y Sedes Administrados */}
          <BusinessBentoGrid
            negocios={negocios}
            sedesByNegocio={sedesByNegocio}
            isLoading={isLoadingNegocios}
            initialAction={initialAction}
            targetBusinessId={targetBusinessId}
            onClearAction={handleClearActionParam}
            onCreateNegocio={createNegocio}
            onUpdateNegocio={updateNegocio}
            onDeleteNegocio={deleteNegocio}
            onCreateSede={createSede}
            onUpdateSede={updateSede}
            onDeleteSede={deleteSede}
          />

          {/* 2. Canales WhatsApp Conectados */}
          <WhatsAppChannelsCard
            negocios={negocios}
            sedesByNegocio={sedesByNegocio}
            isLoading={isLoadingNegocios}
          />
        </div>
      </motion.div>
    </div>
  );
}
