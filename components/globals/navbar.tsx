"use client";

import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { toast } from "sonner";
import UserAvatar from "@/components/user-avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { getWorkflows } from "@/actions/workflow.actions";

const WorkflowSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [workflows, setWorkflows] = useState<
    { _id: string; name: string; description: string }[]
  >([]);

  useEffect(() => {
    (async () => {
      const response = await getWorkflows();
      if (!response.success) {
        toast.error(response.error);
        return;
      }

      setWorkflows(
        response.data.map(({ _id, ...rest }) => ({
          ...rest,
          _id: _id.toString(),
        }))
      );
    })();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && e.ctrlKey) {
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown, false);
    return () => document.removeEventListener("keydown", handleKeyDown, false);
  }, []);

  return (
    <div className="flex w-40 gap-2 items-center rounded-3xl bg-muted p-2">
      <Search className="h-5 w-5" />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger className="outline-none">
          <span className="flex items-center gap-3">
            Search <kbd className="text-xs">ctrl+/</kbd>
          </span>
        </DialogTrigger>
        <DialogContent>
          <Command>
            <CommandInput placeholder="Search for a workflow..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Workflows">
                {workflows.map(({ _id, description, name }) => (
                  <CommandItem key={_id}>
                    <Link
                      href={`/workflows/editor/${_id}`}
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col justify-center"
                    >
                      <p className="text-sm">{name}</p>
                      <p className="text-xs text-neutral-500">{description}</p>
                    </Link>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Navbar = () => {
  const { isSignedIn } = useUser();
  const pathname = usePathname();

  return (
    <header
      className="sticky right-0 left-0 top-0 py-5 pr-6 pl-3 bg-black/40 z-10 h-16
    flex items-center justify-between border-b-[1px] border-neutral-900
    backdrop-blur-lg"
    >
      <Link href="/" className="relative">
        <div className="hidden md:flex items-center gap-[2px] relative">
          <p className="text-lg sm:text-3xl font-bold">S</p>
          <div className="absolute top-2.5 sm:top-3 left-2 sm:left-3 w-4 sm:w-6 aspect-square">
            <Image src="/logo.png" fill alt="logo" className="object-contain" />
          </div>
          <p className="text-lg sm:text-3xl font-bold ml-2 sm:ml-3">napse</p>
        </div>

        <Image
          src="/logo1.png"
          alt="logo"
          width={48}
          height={48}
          quality={100}
          className="inline-block md:hidden"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </Link>

      <aside className="flex items-center gap-4">
        {pathname === "/" ? (
          <>
            <Link
              href="/dashboard"
              className="relative inline-flex h-10 overflow-hidden rounded-full p-[2px]
            focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
            focus:ring-offset-slate-400"
            >
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                {isSignedIn ? "Dashboard" : "Get Started"}
              </span>
            </Link>
            <Link href="#pricing">Pricing</Link>
          </>
        ) : (
          <WorkflowSearch />
        )}

        <UserAvatar />
      </aside>
    </header>
  );
};

export default Navbar;
