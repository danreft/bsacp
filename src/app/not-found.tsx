import { Compass } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
      <EmptyState
        icon={<Compass aria-hidden="true" className="h-6 w-6" />}
        title="Page not found"
        description="That page does not exist, or it belongs to another organization."
        action={<LinkButton href="/">Back to dashboard</LinkButton>}
      />
    </div>
  );
}
