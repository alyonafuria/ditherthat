import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "@/minikit.config";
import { RootProvider } from "./rootProvider";
import "./globals.css";
import HeaderRegion from "@/components/HeaderRegion";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: minikitConfig.miniapp.name,
    description: minikitConfig.miniapp.description,
    other: {
      "fc:miniapp": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        button: {
          title: `Launch ${minikitConfig.miniapp.name}`,
          action: {
            name: `Launch ${minikitConfig.miniapp.name}`,
            type: "launch_miniapp",
          },
        },
      }),
    },
  };
}

const asciiMono = localFont({
  src: [
    { path: "../public/fonts/Courier New.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Courier New Italic.ttf", weight: "400", style: "italic" },
    { path: "../public/fonts/Courier New Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/Courier New Bold Italic.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-ascii-mono",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sourceCodePro.variable} ${asciiMono.variable}`}>
        <RootProvider>
          <SafeArea>
            <div className="appShell">
              <HeaderRegion />
              <main className="mainArea">
                <div className="centerWrap">
                  {children}
                </div>
              </main>
            </div>
          </SafeArea>
        </RootProvider>
      </body>
    </html>
  );
}
