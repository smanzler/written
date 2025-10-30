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

function App() {
  const isMobile = useIsMobile();

  return (
    <ThemeProvider>
      <SidebarProvider defaultOpen={false}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppSidebar collapsible="icon" />
          <SidebarInset>
            <header className="w-full flex h-16 shrink-0 items-center gap-2 px-4 sticky top-0 bg-background">
              {isMobile && <SidebarTrigger />}
              <ModeToggle className="ml-auto" variant="ghost" />
            </header>
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
