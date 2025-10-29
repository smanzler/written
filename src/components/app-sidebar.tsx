import * as React from "react";
import { VersionSwitcher } from "./version-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { BookOpen } from "lucide-react";
import { Link } from "react-router";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup key="new-journal">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={false}>
                <Link to="/">
                  <BookOpen className="size-4" />
                  <span>New Journal</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup key="journals">
          <SidebarGroupLabel>Journals</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {journals?.map((date) => (
                <SidebarMenuItem key={date}>
                  <SidebarMenuButton asChild isActive={false}>
                    <Link to={`/${date}`}>{date}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
