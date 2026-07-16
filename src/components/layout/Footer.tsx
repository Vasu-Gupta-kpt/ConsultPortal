import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.jpeg" alt="IIM Calcutta Consult Club" width={24} height={24} className="rounded-sm" />
          <span>IIM Calcutta Consult Club &copy; {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/cases" className="hover:text-foreground transition-colors">
            Cases
          </Link>
          <Link href="/materials" className="hover:text-foreground transition-colors">
            Materials
          </Link>
          <Link href="/peer-practice" className="hover:text-foreground transition-colors">
            Peer Practice
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
