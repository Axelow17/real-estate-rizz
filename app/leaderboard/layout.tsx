import type { Metadata } from 'next';

const miniAppEmbed = {
  version: "1",
  imageUrl: "https://real-estate-rizz.vercel.app/houses/house1.png",
  button: {
    title: "🏆 View Leaderboard",
    action: {
      type: "launch_miniapp",
      url: "https://real-estate-rizz.vercel.app/leaderboard",
      name: "RealEstate Rizz"
    }
  }
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