export interface TechAndBusinessInfo {
  technologies: string[];
  products: string[];
  services: string[];
  businessCategories: string[];
}

export function extractTechAndBusiness(doc: Document): TechAndBusinessInfo {
  const techs = new Set<string>();
  const products = new Set<string>();
  const services = new Set<string>();
  const categories = new Set<string>();

  const html = doc.documentElement.innerHTML.toLowerCase();

  // 1. Technology Signatures
  const techSignatures: Record<string, string[]> = {
    'React': ['react', '_reactroot', '__reactfiber'],
    'Next.js': ['__next', 'next/dist'],
    'Vue.js': ['vue', '__vue__'],
    'Angular': ['ng-version', 'ng-app'],
    'WordPress': ['wp-content', 'wp-includes', 'wordpress'],
    'Shopify': ['cdn.shopify.com', 'shopify.theme'],
    'Webflow': ['uploads-ssl.webflow.com', 'w-nav'],
    'Tailwind CSS': ['tailwind', 'font-sans', 'text-slate-'],
    'Bootstrap': ['bootstrap.min.css', 'navbar-toggler', 'btn-primary'],
    'Stripe': ['js.stripe.com', 'stripe-element'],
    'Google Analytics': ['google-analytics.com', 'gtag', 'googletagmanager'],
    'HubSpot': ['js.hs-scripts.com', 'hubspot'],
    'Intercom': ['widget.intercom.io', 'intercom-container'],
    'Cloudflare': ['cloudflare', '__cfduid'],
    'Supabase': ['supabase.co', 'supabase'],
    'Firebase': ['firebaseapp.com', 'firebase'],
    'AWS': ['amazonaws.com', 'aws-sdk'],
  };

  for (const [name, cues] of Object.entries(techSignatures)) {
    if (cues.some((cue) => html.includes(cue.toLowerCase()))) {
      techs.add(name);
    }
  }

  // Check meta generator
  const metaGen = doc.querySelector('meta[name="generator"]')?.getAttribute('content');
  if (metaGen) {
    techs.add(metaGen.split(' ')[0]);
  }

  // 2. Products / Services from navigation and heading lists
  const navItems = doc.querySelectorAll('nav a, header a, [class*="services"] h3, [class*="products"] h3, [class*="features"] h3');
  navItems.forEach((el) => {
    const text = el.textContent?.trim();
    if (!text || text.length < 3 || text.length > 40) return;
    const lower = text.toLowerCase();

    if (
      lower.includes('service') ||
      lower.includes('consulting') ||
      lower.includes('development') ||
      lower.includes('design') ||
      lower.includes('marketing') ||
      lower.includes('management')
    ) {
      services.add(text);
    } else if (
      lower.includes('app') ||
      lower.includes('platform') ||
      lower.includes('api') ||
      lower.includes('suite') ||
      lower.includes('cloud') ||
      lower.includes('software')
    ) {
      products.add(text);
    }
  });

  // 3. Detect Categories
  const categoryTerms = [
    'SaaS',
    'B2B',
    'B2C',
    'E-Commerce',
    'FinTech',
    'HealthTech',
    'EdTech',
    'Artificial Intelligence',
    'Consulting',
    'Agency',
    'Real Estate',
    'Legal',
    'Manufacturing',
    'Cybersecurity'
  ];

  categoryTerms.forEach((cat) => {
    if (new RegExp(`\\b${cat}\\b`, 'i').test(html)) {
      categories.add(cat);
    }
  });

  return {
    technologies: Array.from(techs).slice(0, 10),
    products: Array.from(products).slice(0, 8),
    services: Array.from(services).slice(0, 8),
    businessCategories: Array.from(categories).slice(0, 6),
  };
}
