import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "@/minikit.config";
import { RootProvider } from "./rootProvider";
import "./globals.css";
import HeaderRegion from "@/components/HeaderRegion";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const title = minikitConfig.miniapp.name;
  const description = minikitConfig.miniapp.description;
  const image = minikitConfig.miniapp.heroImageUrl;
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    applicationName: title,
    keywords: [
      "dither",
      "image dithering",
      "black and white",
      "halftone",
      "photo to b&w",
      "floyd-steinberg",
      "bayer",
      "blue noise",
    ],
    openGraph: {
      type: "website",
      url: siteUrl,
      title,
      description,
      siteName: title,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical: siteUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    other: {
      "fc:miniapp": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: image,
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
