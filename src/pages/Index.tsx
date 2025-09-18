import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import UploadSection from "@/components/UploadSection";
import BeforeAfterSection from "@/components/BeforeAfterSection";
import FeaturesSection from "@/components/FeaturesSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <BeforeAfterSection />
      <UploadSection />
      <FeaturesSection />
      <FooterSection />
    </Layout>
  );
};

export default Index;
