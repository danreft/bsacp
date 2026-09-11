import { redirect } from "next/navigation";

// Keep existing bookmarks, including the archived view, working.
export default async function EngagementsPage({ searchParams }: PageProps<"/engagements">) {
  const { archived } = await searchParams;
  redirect(archived === "1" ? "/?archived=1" : "/");
}
