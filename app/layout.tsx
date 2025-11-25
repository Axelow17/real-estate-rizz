import "../styles/globals.css";
import type { ReactNode } from "react";

const miniAppEmbed = {
  url: "https://real-estate-rizz.vercel.app",
  name: "RealEstate Rizz",
  description: "Build and manage your virtual real estate empire with rizz points",
  icon: "https://real-estate-rizz.vercel.app/houses/house1.png"
};

export const metadata = {
  title: "RealEstate Rizz",
  description: "Mini app real estate + rizz point",
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
    "fc:frame": JSON.stringify(miniAppEmbed) // backward compatibility
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-primary">
        <div className="min-h-screen flex justify-center">
          <div className="w-full max-w-md px-4 py-6 flex flex-col gap-4">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
