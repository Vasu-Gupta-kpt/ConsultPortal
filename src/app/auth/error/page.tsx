import Link from "next/link";
import { ShieldX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const MESSAGES: Record<string, string> = {
  domain: "Only @iimcal.ac.in email addresses are allowed. Please sign in with your IIM Calcutta Google account.",
  exchange_failed: "Authentication failed. Please try again.",
  no_code: "Invalid sign-in link. Please try again.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message = MESSAGES[reason ?? ""] ?? "Something went wrong during sign-in.";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldX className="h-7 w-7 text-destructive" />
      </div>
      <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">{message}</p>
      <Link href="/" className={buttonVariants()}>
        Back to Home
      </Link>
    </div>
  );
}
