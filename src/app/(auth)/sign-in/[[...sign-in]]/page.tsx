import { SignIn } from "@clerk/nextjs";
import { Mail } from "lucide-react";
import type { Metadata } from "next";

import { DevBypassNotice } from "@/components/dev-bypass-notice";
import { clerkEnabled } from "@/lib/clerk";
import { getDevSession } from "@/lib/dev-session";

export const metadata: Metadata = { title: "Sign in" };

/**
 * Clients join only through a staff-issued Clerk organization invitation, so
 * there is no sign-up route to link to.
 */
function InvitationNotice() {
  return (
    <p className="mt-5 flex items-start gap-2.5 rounded-md bg-canvas px-4 py-3 text-sm text-muted ring-1 ring-hairline ring-inset">
      <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        <span className="font-medium text-ink">Invitation required.</span> Portal
        access is set up by your Boa Safra Ag engagement lead. If you have not
        received an invitation, email{" "}
        <a
          href="mailto:clients@boasafraag.example"
          className="font-medium text-brand-700 underline underline-offset-2"
        >
          clients@boasafraag.example
        </a>
        .
      </span>
    </p>
  );
}

export default async function SignInPage() {
  if (!clerkEnabled) {
    const { identity } = await getDevSession();
    return (
      <>
        <DevBypassNotice action="sign in" user={identity.user} />
        <InvitationNotice />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-center">
        <SignIn fallbackRedirectUrl="/" appearance={{ elements: { rootBox: "w-full" } }} />
      </div>
      <InvitationNotice />
    </>
  );
}
