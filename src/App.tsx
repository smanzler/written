import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import Index from "./components/pages/index";
import { Toaster } from "./components/ui/sonner";
import { useIsMobile } from "./hooks/use-mobile";
import { BrowserRouter, Route } from "react-router";
import { Routes } from "react-router";
import Details from "./components/pages/details";
import Header from "./components/header";
import { useSettingsStore } from "./stores/settingsStore";
import { useAuthStore } from "./stores/authStore";
import { useEffect } from "react";
import Login from "./components/pages/login";
import Signup from "./components/pages/signup";
import { MigrateJournalsDialog } from "./components/auth/migrate-journals-dialog";
import SettingsPage from "./components/pages/settings";

function App() {
  const isMobile = useIsMobile();
  const initializeSettings = useSettingsStore((state) => state.initialize);
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initializeSettings();
    initializeAuth();
  }, [initializeSettings, initializeAuth]);

  return (
    <SidebarProvider defaultOpen={false}>
      <BrowserRouter>
        <AppSidebar collapsible="icon" />
        <SidebarInset>
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/:date" element={<Details />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </SidebarInset>
        <Toaster position={isMobile ? "top-center" : "bottom-right"} />
        <MigrateJournalsDialog />
      </BrowserRouter>
    </SidebarProvider>
  );
}

export default App;
