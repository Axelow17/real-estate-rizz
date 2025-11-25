import type { Metadata } from 'next';

const miniAppEmbed = {
  url: "https://real-estate-rizz.vercel.app/explore",
  name: "RealEstate Rizz - Explore",
  description: "Discover and vote on amazing houses in the real estate rizz community",
  icon: "https://real-estate-rizz.vercel.app/houses/house1.png"
};

export const metadata: Metadata = {
  title: "Explore - RealEstate Rizz",
  description: "Explore houses and cast your votes in the rizz real estate game",
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
    "fc:frame": JSON.stringify(miniAppEmbed)
  }
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}