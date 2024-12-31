import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/providers/store-provider";

import { dark } from "@clerk/themes";
import { cn } from "@/lib/utils";
import { BillingProvider } from "@/providers/billing-provider";
import Navbar from "@/components/globals/navbar";
import { getUser } from "@/actions/user.actions";
import { TPlan } from "@/lib/types";

const font = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Synapse",
  description: "Automate your work with Synapse.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const response = await getUser();
  let credits = "0", tier: TPlan = "Free";

  if (response.success) {
    credits = response.data.credits; 
    tier = response.data.tier;
  }

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{ baseTheme: [dark] }}
    >
      <html lang="en" suppressHydrationWarning className="scroll-smooth">
        <head />
        <body className={cn(font.className, "!pointer-events-auto")}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster />
            <BillingProvider credits={credits} tier={tier}>
              <StoreProvider>
                <Navbar />
                {children}
              </StoreProvider>
            </BillingProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
