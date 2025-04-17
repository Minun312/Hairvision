import * as React from "react";
import { useEffect, useState } from "react";

import { SearchForm } from "@/components/search-form";
import { VersionSwitcher } from "@/components/version-switcher";
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

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

const data = {
  versions: ["1.0.0"],
  navMain: [
    {
      title: "HairVision",
      url: "/",
      items: [
        {
          title: "关于本项目",
          url: "/",
          id: "about",
        },
        {
          title: "示例模型",
          url: "/ModelEx",
          id: "model-ex",
        },
        {
          title: "跑起来",
          url: "/Run3dgs",
          id: "run-3dgs",
        },
        {
          title: "发型分类",
          url: "/Classify",
          id: "classify",
        },
        {
          title: "优化文件格式",
          url: "/Develop",
          id: "develop",
        },
        {
          title: "KsplatViewer",
          url: "/Viewer",
          id: "viewer",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setTheme } = useTheme();
  const [activeItemId, setActiveItemId] = useState("");

  useEffect(() => {
    const currentPath = window.location.pathname;
    for (const section of data.navMain) {
      for (const item of section.items) {
        if (currentPath === "/" && item.url === "/") {
          setActiveItemId(item.title);
          return;
        }
        if (currentPath === item.url) {
          setActiveItemId(item.title);
          return;
        }
      }
    }

    if (!activeItemId && data.navMain[0]?.items[0]) {
      setActiveItemId(data.navMain[0].items[0].title);
    }
  }, [activeItemId]);

  const handleMenuItemClick = (itemTitle: React.SetStateAction<string>) => {
    setActiveItemId(itemTitle);
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader className="bg-transparent">
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.title === activeItemId}
                      onClick={() => handleMenuItemClick(item.title)}
                    >
                      <a href={item.url}>{item.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="theme-toggle"
            size="icon"
            className="!bg-transparent !border-0 !text-foreground dark:!text-foreground !shadow-none"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all text-amber-500 dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all text-indigo-400 dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme("light")}>
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Sidebar>
  );
}
