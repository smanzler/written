import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import Index from "./components/pages/index";
import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";
import { Toaster } from "./components/ui/sonner";
import { useIsMobile } from "./hooks/use-mobile";
import { BrowserRouter, Route } from "react-router";
import { Routes } from "react-router";
import Details from "./components/pages/details";

export const BASE_URL = "/written/";

function App() {
  const isMobile = useIsMobile();

  return (
    <ThemeProvider>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar variant="floating" />
        <SidebarInset>
          <header className="w-full flex h-16 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger />
            <ModeToggle className="ml-auto" variant="ghost" />
          </header>
          <BrowserRouter>
            <Routes>
              <Route path={BASE_URL} element={<Index />} />
              <Route path={`${BASE_URL}:date`} element={<Details />} />
            </Routes>
          </BrowserRouter>
        </SidebarInset>
        <Toaster position={isMobile ? "top-center" : "bottom-right"} />
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
