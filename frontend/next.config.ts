import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'fuchsia-blank-mandrill-946.mypinata.cloud',
    },
    {
      protocol: 'https',
      hostname: 'ipfs.infura.io',
    },
  ],
},

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      electron: false,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;