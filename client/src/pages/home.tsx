import { useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { 
  HeroSection, 
  StatisticsBanner, 
  HowItWorks, 
  FeaturesSection, 
  WhoWeHelp,
  LeaseDashboardPreview,
  FeaturedProperties,
  FAQSection,
  TestimonialsSection,
  CTASection
} from "@/components/home";
import { updateMetaTags, getOrganizationStructuredData, addStructuredData, setCanonicalUrl, getBreadcrumbStructuredData } from "@/lib/seo";

export default function Home() {
  useEffect(() => {
    updateMetaTags({
      title: "Choice Properties - Find Your Perfect Rental Home | Troy, MI Real Estate",
      description: "Your trusted rental housing partner in Troy, MI. Browse 500+ rental properties, apply online, and find your perfect home. Free property search with instant notifications.",
      image: "https://choiceproperties.com/og-image.png",
      url: "https://choiceproperties.com"
    });
    setCanonicalUrl("https://choiceproperties.com");
    addStructuredData(getOrganizationStructuredData(), 'organization');
    addStructuredData(getBreadcrumbStructuredData([
      { name: 'Home', url: 'https://choiceproperties.com' }
    ]), 'breadcrumb');
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <StatisticsBanner />
      <HowItWorks />
      <FeaturesSection />
      <WhoWeHelp />
      <LeaseDashboardPreview />
      <FeaturedProperties />
      <FAQSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
