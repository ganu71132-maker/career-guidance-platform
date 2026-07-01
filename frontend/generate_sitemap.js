import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://rqmpmiziybhiyukklpjk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KMk6tO2FpQVDw9-6kygBoQ_0FUiypzT';

async function generateSitemap() {
  const baseUrl = 'https://nextrapath.in';
  let urls = [
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/explorer`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${baseUrl}/skills`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${baseUrl}/login`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${baseUrl}/register`, changefreq: 'monthly', priority: '0.5' },
  ];

  try {
    // Fetch careers
    const careersRes = await fetch(`${SUPABASE_URL}/rest/v1/careers?select=id`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const careers = await careersRes.json();
    if (Array.isArray(careers)) {
      careers.forEach(career => {
        urls.push({
          loc: `${baseUrl}/career/${career.id}`,
          changefreq: 'weekly',
          priority: '0.7'
        });
      });
    }

    // Fetch skills
    const skillsRes = await fetch(`${SUPABASE_URL}/rest/v1/skills?select=id`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const skills = await skillsRes.json();
    if (Array.isArray(skills)) {
      skills.forEach(skill => {
        urls.push({
          loc: `${baseUrl}/skill/${skill.id}`,
          changefreq: 'weekly',
          priority: '0.6'
        });
      });
    }
  } catch (error) {
    console.error('Error fetching data for sitemap:', error);
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml);
  console.log(`Successfully generated sitemap with ${urls.length} URLs`);
}

generateSitemap();
