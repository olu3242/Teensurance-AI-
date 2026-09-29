/** Isolated build output keeps certification from overwriting a running dev server. */
const nextConfig = {distDir: process.env.NEXT_DIST_DIR || '.next'};
export default nextConfig;
