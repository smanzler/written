import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import Index from "./components/pages/index";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { useIsMobile } from "./hooks/use-mobile";
import { BrowserRouter, Route } from "react-router";
import { Routes } from "react-router";
import Details from "./components/pages/details";
import Header from "./components/header";
import { useSettingsStore } from "./stores/settingsStore";
import { useEffect } from "react";

function App() {
  const isMobile = useIsMobile();
  const initialize = useSettingsStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ThemeProvider>
      <SidebarProvider defaultOpen={false}>
        <BrowserRouter>
          <AppSidebar collapsible="icon" />
          <SidebarInset>
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/:date" element={<Details />} />
            </Routes>
          </SidebarInset>
          <Toaster position={isMobile ? "top-center" : "bottom-right"} />
        </BrowserRouter>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
