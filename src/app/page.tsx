import CrispHeader from "@/components/CrispHeader/CrispHeader";
import StorySection from "@/components/StoryParallax/StoryParallax";
import ProductsSection from "@/components/ProductsSection/ProductsSection";
import SiteFooter from "@/components/SiteFooter/SiteFooter";

export default function Home() {
  return (
    <main data-main>
      <CrispHeader />
      <StorySection />
      <ProductsSection />
      <SiteFooter />
    </main>
  );
}
