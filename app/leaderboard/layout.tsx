import type { Metadata } from 'next';

const miniAppEmbed = {
  url: "https://real-estate-rizz.vercel.app/leaderboard",
  name: "RealEstate Rizz - Leaderboard",
  description: "View the top houses and most voted real estate in the rizz empire",
  icon: "https://real-estate-rizz.vercel.app/houses/house1.png"
};

export const metadata: Metadata = {
  title: "Leaderboard - RealEstate Rizz",
  description: "See the top performing houses in the real estate rizz game",
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
    "fc:frame": JSON.stringify(miniAppEmbed)
  }
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}