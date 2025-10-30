import * as React from "react";
import { VersionSwitcher } from "./version-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { NotebookPen } from "lucide-react";
import { Link, useLocation } from "react-router";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation();
  const { setOpen, setOpenMobile } = useSidebar();

  const journals = useLiveQuery(async () => {
    const journalsArray = await db.journals
      .orderBy("createdAt")
      .reverse()
      .toArray();
    // Group journals by date string (YYYY-MM-DD)
    const data = journalsArray.reduce((grouped, journal) => {
      const date =
        journal.createdAt instanceof Date
          ? journal.createdAt.toISOString().slice(0, 10)
          : new Date(journal.createdAt).toISOString().slice(0, 10);
      if (!grouped.includes(date)) {
        grouped.push(date);
      }
      return grouped;
    }, [] as string[]);

    return data;
  });

  const isToday = (date: Date) => {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  // const isYesterday = (date: Date) => {
  //   const yesterday = new Date();
  //   yesterday.setDate(yesterday.getDate() - 1);
  //   return (
  //     date.getFullYear() === yesterday.getFullYear() &&
  //     date.getMonth() === yesterday.getMonth() &&
  //     date.getDate() === yesterday.getDate()
  //   );
  // };

  // const isThisWeek = (date: Date) => {
  //   const now = new Date();
  //   const startOfWeek = new Date(now);
  //   startOfWeek.setDate(now.getDate() - now.getDay());
  //   startOfWeek.setHours(0, 0, 0, 0);
  //   const endOfWeek = new Date(startOfWeek);
  //   endOfWeek.setDate(startOfWeek.getDate() + 6);
  //   endOfWeek.setHours(23, 59, 59, 999);
  //   return (
  //     date >= startOfWeek &&
  //     date <= endOfWeek &&
  //     !isToday(date) &&
  //     !isYesterday(date)
  //   );
  // };

  const getFormattedDate = (date: string) => {
    const [year, month, day] = date.split("-").map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return date;
    const dateObject = new Date(year, month - 1, day);

    if (isToday(dateObject)) {
      return "Today";
    }

    // if (isYesterday(dateObject)) {
    //   return "Yesterday";
    // }

    // if (isThisWeek(dateObject)) {
    //   return dateObject.toLocaleDateString("en-US", {
    //     weekday: "long",
    //   });
    // }

    return dateObject.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher />
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <SidebarGroup key="new-journal">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/"}>
                <Link
                  to="/"
                  onClick={() => {
                    setOpen(false);
                    setOpenMobile(false);
                  }}
                >
                  <NotebookPen className="size-4" />
                  <span>New Journal</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup
          key="journals"
          className="group-data-[collapsible=icon]:hidden"
        >
          <SidebarGroupLabel>Journals</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {journals?.map((date) => (
                <SidebarMenuItem key={date}>
                  <SidebarMenuButton asChild isActive={pathname === `/${date}`}>
                    <Link
                      to={`/${date}`}
                      className="overflow-hidden whitespace-nowrap"
                      onClick={() => setOpenMobile(false)}
                    >
                      {getFormattedDate(date)}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
