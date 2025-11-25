import type { Metadata } from 'next';

const miniAppEmbed = {
  url: "https://real-estate-rizz.vercel.app/dashboard",
  name: "RealEstate Rizz - Dashboard",
  description: "Manage your house, mine rizz points, and explore the real estate empire",
  icon: "https://real-estate-rizz.vercel.app/houses/house1.png"
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