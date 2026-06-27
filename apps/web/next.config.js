const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};
module.exports = nextConfig;
