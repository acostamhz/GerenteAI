import { useLocation } from "react-router";
import { ProfileView } from "@/features/shared-profile/ProfileView";

export function ProfilePage() {
  const location = useLocation();
  // To simulate the admin mode for now, we can check if the user came from an admin route or just pass a state.
  // In a real app this would come from an AuthContext or global store.
  // For UI purposes here, if they navigate to profile while in admin mode, they see admin view.
  // Wait, if the profile route is just /profile, how do we know they are admin? 
  // Let's assume we can mock it by checking localStorage or just default to false for the UI prototype, 
  // but since we want to demonstrate both, we can read a mock flag.
  // We will default to false, but allow a query param ?admin=true to test it.
  const isAdmin = new URLSearchParams(location.search).get("admin") === "true";

  return <ProfileView isAdmin={isAdmin} />;
}
