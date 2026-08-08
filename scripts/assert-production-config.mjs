const siteUrl = process.env.SITE_URL?.trim();

if (!siteUrl) {
  console.error('SITE_URL is required for production deployment.');
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(siteUrl);
} catch {
  console.error('SITE_URL must be a valid absolute URL.');
  process.exit(1);
}

if (parsed.protocol !== 'https:') {
  console.error('SITE_URL must use HTTPS.');
  process.exit(1);
}

if (parsed.hostname.endsWith('.invalid') || parsed.hostname === 'localhost') {
  console.error('SITE_URL must point to the real production hostname.');
  process.exit(1);
}

console.log(`Production site URL: ${parsed.origin}`);
