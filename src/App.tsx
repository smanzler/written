import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import Index from "./components/pages/index";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { useIsMobile } from "./hooks/use-mobile";
import { HashRouter, Route } from "react-router";
import { Routes } from "react-router";
import Details from "./components/pages/details";
import { JournalProvider } from "./providers/JournalProvider";
import Header from "./components/header";
import { SettingsProvider } from "./providers/SettingsProvider";

function App() {
  const isMobile = useIsMobile();

  return (
    <ThemeProvider>
      <SettingsProvider>
        <JournalProvider>
          <SidebarProvider defaultOpen={false}>
            <HashRouter>
              <AppSidebar collapsible="icon" />
              <SidebarInset>
                <Header />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/:date" element={<Details />} />
                </Routes>
              </SidebarInset>
              <Toaster position={isMobile ? "top-center" : "bottom-right"} />
            </HashRouter>
          </SidebarProvider>
        </JournalProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
