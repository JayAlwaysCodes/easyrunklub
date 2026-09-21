import Image from "next/image";
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
        "flex items-center gap-2 font-heading text-lg font-semibold tracking-tight",
        className
      )}
    >
      <Image
        src="/logo.jpeg"
        alt="Easy Run Klub"
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover"
        priority
      />
      Easy Run Klub
    </Link>
  );
}