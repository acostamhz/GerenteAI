import { motion } from 'motion/react';
import { IdentityHeroCard } from './components/IdentityHeroCard';
import { QuickContactCard } from './components/QuickContactCard';
import { BusinessBentoGrid } from './components/BusinessBentoGrid';
import { WhatsAppChannelsCard } from './components/WhatsAppChannelsCard';
import { useProfileData } from './hooks/useProfileData';

export function ProfileView({ isAdmin: _isAdmin }: { isAdmin?: boolean } = {}) {
  const {
    user,
    negocios,
    isLoadingNegocios,
    isSavingUser,
    actionError,
    actionSuccess,
    updateTelefono,
    requestEmailChange,
    createNegocio,
    deleteNegocio,
    clearFeedback,
  } = useProfileData();

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Breadcrumb / Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Centro de Perfil & Negocios
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Administra tu identidad, empresas registradas y canales autónomos de Inteligencia Artificial.
          </p>
        </div>
      </div>

      {/* Main 2-Column Asymmetric Bento Grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* Left Column (1/3 Width - Sticky Hero Card) */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
          <IdentityHeroCard
            user={user}
            isSavingUser={isSavingUser}
            onRequestEmailChange={requestEmailChange}
          />
        </div>

        {/* Right Column (2/3 Width - Interactive Bento Hub) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Bloque 1: Contacto Directo */}
          <QuickContactCard
            user={user}
            isSavingUser={isSavingUser}
            actionError={actionError}
            actionSuccess={actionSuccess}
            onUpdatePhone={updateTelefono}
            onClearFeedback={clearFeedback}
          />

          {/* Bloque 2: Empresas Administradas */}
          <BusinessBentoGrid
            negocios={negocios}
            isLoading={isLoadingNegocios}
            onCreateNegocio={createNegocio}
            onDeleteNegocio={deleteNegocio}
          />

          {/* Bloque 3: Canales WhatsApp & Bots */}
          <WhatsAppChannelsCard />
        </div>
      </motion.div>
    </div>
  );
}
