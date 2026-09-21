import Image from "next/image";
import Link from "next/link";

import { BLOG_POSTS } from "@/lib/placeholder-data/blog-posts";

export default function BlogListingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="mb-10 font-heading text-3xl font-semibold md:text-4xl">
        Our Blog
      </h1>

      <div className="grid gap-8 md:grid-cols-3">
        {BLOG_POSTS.map((post) => (
          <div key={post.slug} className="space-y-3">
            <div className="relative h-56 w-full overflow-hidden rounded-2xl">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
            <h2 className="font-medium leading-snug">{post.title}</h2>
            <Link
              href={`/blog/${post.slug}`}
              className="inline-block text-sm font-medium text-brand-green hover:underline"
            >
              Read more
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}