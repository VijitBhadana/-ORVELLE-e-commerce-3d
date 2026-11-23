import HeroScroll from "@/components/home/HeroScroll";
import Marquee from "@/components/home/Marquee";
import OutfitDeck from "@/components/home/OutfitDeck";
import StreetDrop from "@/components/home/StreetDrop";
import FeaturedCollection from "@/components/home/FeaturedCollection";
import Editorial from "@/components/home/Editorial";
import StyleShowcase from "@/components/home/StyleShowcase";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import NewArrivals from "@/components/home/NewArrivals";
import TestimonialCorridor from "@/components/home/TestimonialCorridor";

export default function Home() {
  return (
    <>
      <HeroScroll />
      <Marquee />
      <StreetDrop />
      <OutfitDeck />
      <FeaturedCollection />
      <Editorial />
      <StyleShowcase />
      <WhyChooseUs />
      <NewArrivals />
      <TestimonialCorridor />
    </>
  );
}
