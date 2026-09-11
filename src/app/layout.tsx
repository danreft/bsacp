import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import { EnvBanner } from "@/components/env-banner";
import { ToastProvider } from "@/components/toast";
import { clerkEnabled } from "@/lib/clerk";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Boa Safra Ag Client Portal",
    template: "%s · Boa Safra Ag",
  },
  description:
    "View and download the documents exchanged during your Boa Safra Ag engagements.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const document = (
    <html lang="en" className="h-full">
      <body className="flex h-svh flex-col overflow-hidden">
        <EnvBanner />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );

  // ClerkProvider is only rendered when keys exist. Without it the app runs on
  // the dev-bypass identity instead of crashing on a missing publishable key.
  if (!clerkEnabled) return document;

  return (
    <ClerkProvider appearance={{ variables: { colorPrimary: "#1f4d31" } }}>
      {document}
    </ClerkProvider>
  );
}
