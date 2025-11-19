import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/authStore";
import {
  EllipsisVertical,
  LogIn,
  LogOut,
  Settings,
  User,
  UserCircle,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router";

export function NavUser() {
  const { isMobile, setOpen, setOpenMobile } = useSidebar();
  const { user, profile, signOut } = useAuthStore();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {user ? (
                <>
                  <Avatar className="h-8 w-8 rounded-lg grayscale">
                    <AvatarImage
                      src={profile?.avatar_url ?? undefined}
                      alt={profile?.username ?? ""}
                    />
                    <AvatarFallback className="rounded-lg">
                      {profile?.username?.charAt(0) ?? user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {profile?.username ?? ""}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                  <EllipsisVertical className="ml-auto size-4" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center size-8 rounded-lg bg-muted shrink-0">
                    <User className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate">Guest</span>
                  </div>
                  <EllipsisVertical className="ml-auto size-4" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {user ? (
              <>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={profile?.avatar_url ?? undefined}
                        alt={profile?.username ?? ""}
                      />
                      <AvatarFallback className="rounded-lg">
                        {profile?.username?.charAt(0) ?? user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {profile?.username ?? user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <UserCircle />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    to="/login"
                    onClick={() => {
                      setOpen(false);
                      setOpenMobile(false);
                    }}
                  >
                    <LogIn />
                    Login
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/signup"
                    onClick={() => {
                      setOpen(false);
                      setOpenMobile(false);
                    }}
                  >
                    <UserPlus />
                    Register
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
