import type { Metadata } from 'next';

const miniAppEmbed = {
  url: "https://real-estate-rizz.vercel.app/my-stay",
  name: "RealEstate Rizz - My Stay",
  description: "Manage your stays, earn rewards, and track your mining progress",
  icon: "https://real-estate-rizz.vercel.app/houses/house1.png"
};

export const metadata: Metadata = {
  title: "My Stay - RealEstate Rizz",
  description: "Track your stays and mining rewards in the real estate rizz app",
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
    "fc:frame": JSON.stringify(miniAppEmbed)
  }
};

export default function MyStayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}