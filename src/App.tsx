import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import Index from "./components/pages/index";
import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar variant="floating" />
        <SidebarInset>
          <header className="absolute top-0 w-full flex h-16 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger />
            <ModeToggle className="ml-auto" variant="ghost" />
          </header>
          <Index />
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
