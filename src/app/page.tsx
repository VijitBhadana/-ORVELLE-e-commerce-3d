import HeroScroll from "@/components/home/HeroScroll";
import Marquee from "@/components/home/Marquee";
import OutfitDeck from "@/components/home/OutfitDeck";
import OriginalsSection from "@/components/home/OriginalsSection";
import StreetDrop from "@/components/home/StreetDrop";
import FeaturedCollection from "@/components/home/FeaturedCollection";
import StyleShowcase from "@/components/home/StyleShowcase";
import WhyChooseUs from "@/components/home/WhyChooseUs";

export default function Home() {
  return (
    <>
      <HeroScroll />
      <Marquee />
      <StreetDrop />
      <OutfitDeck />
      <OriginalsSection />
      <FeaturedCollection />
      <StyleShowcase />
      <WhyChooseUs />
    </>
  );
}
