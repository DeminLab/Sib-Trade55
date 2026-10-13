import type { NextConfig } from "next";
import path from "node:path";
import { redirects as redirectRules } from "./src/lib/redirects";
import { imageDeviceSizes, imageThumbnailSizes } from "./src/lib/image-sizes";


const nextConfig: NextConfig = {
  output: "standalone",
  images: { deviceSizes: imageDeviceSizes, imageSizes: imageThumbnailSizes },
  // Runtime databases, backups and secrets must never be part of a deployment bundle.
  outputFileTracingExcludes: { '/**': ['./data/**', './.env*', './.git/**', './.agents/**', './brag-output-*/**', './tests/**'] },
  allowedDevOrigins: ["192.168.0.110"],

  // Redirects are defined in src/lib/redirects.ts — edit there.
  async redirects() {
    return redirectRules;
  },
};

export default async function config() {
  // Keep native payload validation in a project-local cache on Windows.
  if (process.platform === 'win32' && process.env.SWC_NATIVE_BINDING_CACHE === undefined) process.env.SWC_NATIVE_BINDING_CACHE = path.resolve('data/runtime-cache/swc')
  const { default: createNextIntlPlugin } = await import('next-intl/plugin')
  return createNextIntlPlugin('./src/i18n/request.ts')(nextConfig)
}
