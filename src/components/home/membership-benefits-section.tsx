import { Sparkles } from "lucide-react";

const BENEFITS = [
  {
    title: "Inclusive Community",
    points: [
      "Runners of all ages and abilities are welcome.",
      "A supportive environment to achieve your personal best.",
    ],
    highlighted: false,
  },
  {
    title: "Run at Your Own Pace",
    points: [
      "Weekly group and individual runs at various locations.",
      "Every run counts — even a planned walk is a run.",
    ],
    highlighted: false,
  },
  {
    title: "Share & Grow Together",
    points: [
      "Share your achievements and challenges with the Klub.",
      "Learn from others and improve your own performance.",
    ],
    highlighted: true,
  },
];

export function MembershipBenefitsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <h2 className="mb-8 font-heading text-2xl font-semibold md:text-3xl">
        Membership Benefits
      </h2>

      <div className="grid gap-6 md:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <div
            key={benefit.title}
            className={`rounded-2xl border p-6 ${
              benefit.highlighted ? "bg-brand-mint" : "bg-background"
            }`}
          >
            <Sparkles className="h-5 w-5 text-brand-forest" />
            <h3 className="mt-4 font-medium">{benefit.title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {benefit.points.map((point, index) => (
                <li key={index}>&bull; {point}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}