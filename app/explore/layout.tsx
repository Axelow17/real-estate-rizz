import type { Metadata } from 'next';

const miniAppEmbed = {
  version: "1",
  imageUrl: "https://real-estate-rizz.vercel.app/houses/house1.png",
  button: {
    title: "🔍 Explore Houses",
    action: {
      type: "launch_miniapp",
      url: "https://real-estate-rizz.vercel.app/explore",
      name: "RealEstate Rizz"
    }
  }
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