import CrispHeader from "@/components/CrispHeader/CrispHeader";
import StorySection from "@/components/StoryParallax/StoryParallax";
import ProductsSection from "@/components/ProductsSection/ProductsSection";

export default function Home() {
  return (
    <main data-main>
      <CrispHeader />
      <StorySection />
      <ProductsSection />
    </main>
  );
}
