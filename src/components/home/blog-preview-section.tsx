import Image from "next/image";
import Link from "next/link";

import { BLOG_POSTS } from "@/lib/placeholder-data/blog-posts";

export function BlogPreviewSection() {
  const previewPosts = BLOG_POSTS.slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold md:text-3xl">
          See What&apos;s Happening
        </h2>
        <Link
          href="/blog"
          className="rounded-full bg-brand-mint px-4 py-1.5 text-sm font-medium text-brand-forest transition-colors hover:bg-brand-mint/70"
        >
          View more
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {previewPosts.map((post) => (
          <div key={post.slug} className="space-y-3">
            <div className="relative h-56 w-full overflow-hidden rounded-2xl">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
            <h3 className="font-medium leading-snug">{post.title}</h3>
            <Link
              href={`/blog/${post.slug}`}
              className="inline-block text-sm font-medium text-brand-green hover:underline"
            >
              Read more
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}