import { PersonalDataCard } from "./components/PersonalDataCard";
import { ApprovedPhonesCard } from "./components/ApprovedPhonesCard";
import { BusinessListCard } from "./components/BusinessListCard";

export function ProfileView({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu información personal y accesos</p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(320px,auto)]">
        
        {/* Personal Data - Spans 8 columns */}
        <div className="md:col-span-8">
          <PersonalDataCard isAdmin={isAdmin} />
        </div>

        {/* Approved Phones - Spans 4 columns */}
        <div className="md:col-span-4">
          <ApprovedPhonesCard isAdmin={isAdmin} />
        </div>

        {/* Businesses List - Spans 12 columns for admin (hero) or 12 for client (grid) */}
        <div className="md:col-span-12">
          <BusinessListCard isAdmin={isAdmin} />
        </div>

      </div>
    </div>
  );
}
