import { BrowserRouter } from "react-router";
import { AppRoutes } from "@/routes";
import { ScrollToTop } from "@/shared/components/layout/ScrollToTop";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  );
}
