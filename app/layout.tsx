import "../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "RealEstate Rizz",
  description: "Mini app real estate + rizz point"
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
