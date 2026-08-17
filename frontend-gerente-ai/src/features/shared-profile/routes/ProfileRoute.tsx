import { useLocation } from "react-router";
import { ProfileView } from "../ProfileView";

export function ProfileRoute() {
  const location = useLocation();
  const isAdmin = new URLSearchParams(location.search).get("admin") === "true";

  return <ProfileView isAdmin={isAdmin} />;
}
