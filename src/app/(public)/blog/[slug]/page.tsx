import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BLOG_POSTS } from "@/lib/placeholder-data/blog-posts";

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link
        href="/blog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-green hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Go back
      </Link>

      <h1 className="font-heading text-3xl font-semibold leading-tight md:text-4xl">
        {post.title}
      </h1>

      <p className="mt-3 text-sm text-muted-foreground">
        {post.author.name} &middot; {post.author.email}
      </p>

      <div className="relative mt-8 h-72 w-full overflow-hidden rounded-2xl md:h-96">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover"
        />
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_260px]">
        <div className="space-y-6">
          <div>
            <h2 className="font-medium">Key Takeaways:</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {post.keyTakeaways.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            {post.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>

        <aside className="hidden md:block">
          <div className="sticky top-24 rounded-xl border p-4">
            <p className="text-sm font-medium">Table of Contents</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Key Takeaways</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}