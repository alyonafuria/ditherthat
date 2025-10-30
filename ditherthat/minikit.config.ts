const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000";

/**
 * MiniApp configuration object. Must follow the mini app manifest specification.
 *
 * @see {@link https://docs.base.org/mini-apps/features/manifest}
 */
export const minikitConfig = {
  "accountAssociation": {
    "header": "eyJmaWQiOjc1MTMsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgxMTA5MjFFMTg2YjQ2MDUwQmI0NUJhOThhMzRCMThhYzAxQzkwZUQ0In0",
    "payload": "eyJkb21haW4iOiJkaXRoZXJ0aGF0LnZlcmNlbC5hcHAifQ",
    "signature": "2axVcWVYV6DQ85mQWTf+lclCZSFOGWsNepQyux260v48gf5PqIOE5kCcCcaeFyF6nRQOVssCPDSBF6+JR0+ONhw="
  },
  baseBuilder: {
    allowedAddresses: [],
  },
  miniapp: {
    version: "1",
    name: "ditherthat",
    subtitle: "just dither that",
    description: "photoshop for your nfts",
    screenshotUrls: [],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "art-creativity",
    tags: ["dithering", "nft", "art", "edit"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "dither that",
    ogTitle: "ditherthat",
    ogDescription: "photoshop for your nfts",
    ogImageUrl: `${ROOT_URL}/hero.png`,
  },
} as const;
