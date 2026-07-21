import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.url}/estate`,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.url}/experiences`,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.url}/gallery`,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.url}/policies`,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.url}/book`,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.url}/contact`,
      lastModified: new Date(),
    },
  ]
}
