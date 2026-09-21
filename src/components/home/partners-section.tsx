import Image from "next/image";

// Placeholder structure — shaped as an array so more sponsor logos can be
// added later (by you now, or via an admin upload feature eventually)
// without changing this component's layout logic.
const PARTNERS = [
  { name: "5&6 Sporty Outfits", logo: "/partners/partners-1.png" },
];

export function PartnersSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <h2 className="mb-8 font-heading text-2xl font-semibold md:text-3xl">
        Our Partners &amp; Sponsors
      </h2>

        <div className="space-y-6">
          {PARTNERS.map((partner) => (
            <div key={partner.name} className="relative h-40 w-full md:h-56">
              <Image
                src={partner.logo}
                alt={partner.name}
                fill
                className="object-contain object-left"
              />
            </div>
          ))}
        </div>
    </section>
  );
}