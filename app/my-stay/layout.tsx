import type { Metadata } from 'next';

const miniAppEmbed = {
  version: "1",
  imageUrl: "https://real-estate-rizz.vercel.app/houses/house1.png",
  button: {
    title: "🏨 Manage My Stay",
    action: {
      type: "launch_miniapp",
      url: "https://real-estate-rizz.vercel.app/my-stay",
      name: "RealEstate Rizz"
    }
  }
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