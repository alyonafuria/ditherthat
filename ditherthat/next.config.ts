import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // Shim optional React Native deps pulled in by MetaMask SDK via wagmi connectors
    // to prevent Next from trying to bundle them in web builds.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (config.resolve.alias as any)["@react-native-async-storage/async-storage"] = false;
    return config;
  },
};

export default nextConfig;
