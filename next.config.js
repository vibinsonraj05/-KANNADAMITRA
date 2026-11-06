/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Keep development chunks separate from production build output to prevent
  // stale webpack module maps when switching between `next dev` and `next start`.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};
