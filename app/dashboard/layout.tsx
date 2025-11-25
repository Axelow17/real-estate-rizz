import type { Metadata } from 'next';

const miniAppEmbed = {
  version: "1",
  imageUrl: "https://real-estate-rizz.vercel.app/houses/house1.png",
  button: {
    title: "🏠 Manage My House",
    action: {
      type: "launch_miniapp",
      url: "https://real-estate-rizz.vercel.app/dashboard",
      name: "RealEstate Rizz"
    }
  }
};

export const metadata: Metadata = {
  title: "Dashboard - RealEstate Rizz",
  description: "Manage your virtual real estate and rizz points",
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
    "fc:frame": JSON.stringify(miniAppEmbed)
  }
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}