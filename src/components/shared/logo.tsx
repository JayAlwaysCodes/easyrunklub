import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-semibold tracking-tight text-lg flex items-center gap-1.5",
        className
      )}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
        E
      </span>
      Easy Run Klub
    </Link>
  );
}