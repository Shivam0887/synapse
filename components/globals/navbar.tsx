import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import UserInfo from "../infobar/user-info";

const Navbar = async () => {
  const user = await currentUser();

  return (
    <header
      className="sticky right-0 left-0 top-0 p-4 bg-black/40 z-10 h-20
    flex items-center justify-between border-b-[1px] border-neutral-900
    backdrop-blur-lg"
    >
      <aside className="flex items-center gap-[2px] relative">
        <p className="text-lg sm:text-3xl font-bold">S</p>
        <div className="absolute top-2.5 sm:top-3 left-2 sm:left-3 w-4 sm:w-6 aspect-square">
          <Image src="/logo.png" fill alt="logo" className="object-contain" />
        </div>
        <p className="text-lg sm:text-3xl font-bold ml-2 sm:ml-3">napse</p>
      </aside>

      <aside className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="relative inline-flex h-10 overflow-hidden rounded-full p-[2px]
         focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
         focus:ring-offset-slate-400"
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
          <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
            {user ? "Dashboard" : "Get Started"}
          </span>
        </Link>
        <Link href="#pricing">Pricing</Link>
        {user ? <UserInfo isHome={true} /> : null}
      </aside>
    </header>
  );
};

export default Navbar;
