import "../styles/globals.css";
import type { ReactNode } from "react";

const miniAppEmbed = {
  version: "1",
  imageUrl: "https://real-estate-rizz.vercel.app/houses/house1.png",
  button: {
    title: "🏠 Build Your Empire",
    action: {
      type: "launch_frame",
      url: "https://real-estate-rizz.vercel.app",
      name: "RealEstate Rizz"
    }
  }
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
          <div className="w-[424px] h-[695px] px-4 py-6 flex flex-col gap-4 overflow-hidden">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
