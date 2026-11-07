import createMDX from '@next/mdx';
import type { NextConfig } from 'next';
import { SECURITY_HEADERS } from './src/lib/security/headers';

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }];
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
