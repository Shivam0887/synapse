"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { menuOptions } from "@/lib/constants";

import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import ActionTooltip from "@/components/globals/action-tooltip";

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-black w-16 pt-10 h-full flex flex-col justify-between items-center gap-10 py-6 px-2">
      <div className="flex flex-col gap-8 items-center justify-center">
        <TooltipProvider>
          {menuOptions.map(({ Component, href, name }) => (
            <ul key={name}>
              <ActionTooltip
                side="right"
                align="center"
                sideOffset={30}
                label={
                  <li>
                    <Link
                      href={href}
                      className={cn(
                        "group h-8 w-8 flex items-center justify-center scale-[1.5] rounded-lg p-[3px]",
                        { "dark:bg-[#2f006b] bg-[#eee0ff]": pathname.includes(href) }
                      )}
                    >
                      {Component({ selected: pathname.includes(href) })}
                    </Link>
                  </li>
                }
              >
                <p>{name}</p>
              </ActionTooltip>
            </ul>
          ))}
        </TooltipProvider>
        <Separator />
      </div>
    </nav>
  );
};

export default Sidebar;
