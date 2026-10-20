import type { Metadata } from "next";

import { klubNature, klubObjectives } from "@/lib/placeholder-data/about";

export const metadata: Metadata = {
  title: "About | Easy Run Klub",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading text-3xl font-semibold md:text-4xl">
          About Easy Run Klub
        </h1>

        <div className="mt-8 space-y-6 text-muted-foreground">
          <p>
            Welcome to Easy Run Klub, the ultimate running club for runners of
            all levels! Whether you&apos;re a seasoned marathoner or just
            lacing up your running shoes for the first time, we are here to
            support, motivate, and inspire each other.
          </p>

          <h2 className="font-heading text-xl font-semibold text-foreground">
            Who We Are
          </h2>

          <p>{klubNature}</p>

          <h2 className="font-heading text-xl font-semibold text-foreground">
            Why Join Easy Run Klub?
          </h2>

          <p>
            <strong className="text-foreground">Inclusive Community:</strong>{" "}
            We welcome runners of all ages and abilities. The Klub fosters a
            supportive environment where everyone can achieve their personal
            best.
          </p>

          <p>
            <strong className="text-foreground">
              Weekly Group/Individual Runs:
            </strong>{" "}
            Join us for our weekly group or individual runs, which take place
            in various scenic locations anywhere you are. Runners run at their
            pace so that everyone finds their perfect fit. Remember
            &ldquo;Every Run is a Run! A Planned Walk is a Run!&rdquo;
          </p>

          <p>
            <strong className="text-foreground">
              Sharing Achievements and Challenging Experiences:
            </strong>{" "}
            The Klub encourages members to share their run achievements and
            challenging experiences. By doing so, others can advise or learn,
            improving individual performance.
          </p>
        </div>
      </div>

      {/* Aims and objects */}
      <section className="mt-16">
        <h2 className="text-center font-heading text-2xl font-semibold md:text-3xl">
          Our Aims &amp; Objectives
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Everything we do at Easy Run Klub is built around these goals.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {klubObjectives.map((objective, index) => (
            <div
              key={objective.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <span className="text-sm font-semibold text-brand-green">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 font-heading text-lg font-semibold text-brand-forest">
                {objective.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {objective.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto mt-16 max-w-3xl">
        <div className="space-y-6 text-muted-foreground">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            In the future, we also intend to:
          </h2>

          <p>
            <strong className="text-foreground">
              Develop Training Programs:
            </strong>{" "}
            From 5Ks to marathons, the Klub&apos;s structured training
            programmes will be designed to help you reach your goals.
          </p>

          <p>
            <strong className="text-foreground">Social Events:</strong>{" "}
            Running is more fun with friends! Klub members will have running
            buddies within their localities and enjoy after-run brunches,
            community events, and social gatherings with fellow runners.
          </p>

          <p>
            <strong className="text-foreground">Health &amp; Wellness:</strong>{" "}
            The Klub will invite guest speakers and hold workshops focused on
            nutrition, injury prevention, and overall wellness.
          </p>

          <h2 className="font-heading text-xl font-semibold text-foreground">
            Join Us!
          </h2>

          <p>
            Whether you&apos;re looking to improve your speed, build
            endurance, or simply enjoy the camaraderie of running with others,
            Easy Run Klub is the perfect group for you. Come run with us and
            be a part of our vibrant running community!
          </p>

          <p className="font-heading text-lg font-semibold text-foreground">
            Easy Run Klub! — Fun &amp; Fitness for Life! Let&apos;s Go There!
          </p>
        </div>
      </div>
    </div>
  );
}