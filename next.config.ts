
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // If you use Supabase Storage for avatars or resource images,
      // add your Supabase project's image hostname here.
      // Example:
      // {
      //   protocol: 'https',
      //   hostname: 'yourprojectid.supabase.co',
      //   port: '',
      //   pathname: '/storage/v1/object/public/**',
      // },
    ],
  },
};

export default nextConfig;
