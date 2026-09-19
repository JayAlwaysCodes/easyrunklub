export default function HomePage() {
  return (
    <div className="p-12 space-y-4">
      <div className="bg-brand-forest text-white p-6 rounded-lg font-heading text-2xl">
        Forest background, heading font
      </div>
      <div className="bg-brand-green text-white p-6 rounded-lg font-sans">
        Green background, body font
      </div>
      <div className="bg-brand-mint p-6 rounded-lg">Mint background</div>
      <div className="bg-brand-cream border p-6 rounded-lg">
        Cream background
      </div>
    </div>
  );
}