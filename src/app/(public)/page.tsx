import { HeroSection } from "@/components/home/hero-section";
import { AboutSection } from "@/components/home/about-section";
import { UpcomingEventsSection } from "@/components/home/upcoming-events-section";
import { CommunitySection } from "@/components/home/community-section";
import { BlogPreviewSection } from "@/components/home/blog-preview-section";
import { MembershipBenefitsSection } from "@/components/home/membership-benefits-section";
import { PartnersSection } from "@/components/home/partners-section";
import { CtaSection } from "@/components/home/cta-section";

export default function HomePage() {
  return (
    <div className="bg-brand-cream">
      <HeroSection />
      <AboutSection />
      <UpcomingEventsSection />
      <CommunitySection />
      <BlogPreviewSection />
      <MembershipBenefitsSection />
      <PartnersSection />
      <CtaSection />
    </div>
  );
}