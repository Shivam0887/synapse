import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/providers/theme-provider";
import ModalProvider from "@/providers/modal-provider";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/providers/store-provider";

import { dark } from "@clerk/themes";
import { cn } from "@/lib/utils";
import { BillingProvider } from "@/providers/billing-provider";

const font = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Synapse",
  description: "Automate your work with Synapse.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            <ModalProvider>
              <BillingProvider>
                <StoreProvider>{children}</StoreProvider>
              </BillingProvider>
            </ModalProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
