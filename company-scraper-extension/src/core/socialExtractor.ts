export interface SocialLinks {
  linkedinUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  githubUrl: string;
}

export function extractSocialLinks(doc: Document): SocialLinks {
  const result: SocialLinks = {
    linkedinUrl: 'N/A',
    twitterUrl: 'N/A',
    facebookUrl: 'N/A',
    instagramUrl: 'N/A',
    youtubeUrl: 'N/A',
    githubUrl: 'N/A',
  };

  const links = doc.querySelectorAll<HTMLAnchorElement>('a[href]');

  links.forEach((a) => {
    const href = a.href?.trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

    const lower = href.toLowerCase();

    // LinkedIn
    if (
      result.linkedinUrl === 'N/A' &&
      (lower.includes('linkedin.com/company/') || lower.includes('linkedin.com/school/'))
    ) {
      result.linkedinUrl = href.split('?')[0];
    } else if (result.linkedinUrl === 'N/A' && lower.includes('linkedin.com/in/')) {
      result.linkedinUrl = href.split('?')[0];
    }

    // Twitter / X
    if (
      result.twitterUrl === 'N/A' &&
      (lower.includes('twitter.com/') || lower.includes('x.com/')) &&
      !lower.includes('/intent/') &&
      !lower.includes('/share')
    ) {
      result.twitterUrl = href.split('?')[0];
    }

    // Facebook
    if (
      result.facebookUrl === 'N/A' &&
      lower.includes('facebook.com/') &&
      !lower.includes('/sharer') &&
      !lower.includes('/dialog/')
    ) {
      result.facebookUrl = href.split('?')[0];
    }

    // Instagram
    if (
      result.instagramUrl === 'N/A' &&
      lower.includes('instagram.com/') &&
      !lower.includes('/p/') &&
      !lower.includes('/explore/')
    ) {
      result.instagramUrl = href.split('?')[0];
    }

    // YouTube
    if (
      result.youtubeUrl === 'N/A' &&
      (lower.includes('youtube.com/@') ||
        lower.includes('youtube.com/channel/') ||
        lower.includes('youtube.com/c/') ||
        lower.includes('youtube.com/user/'))
    ) {
      result.youtubeUrl = href.split('?')[0];
    }

    // GitHub
    if (
      result.githubUrl === 'N/A' &&
      lower.includes('github.com/') &&
      !lower.includes('github.com/login') &&
      !lower.includes('github.com/join')
    ) {
      result.githubUrl = href.split('?')[0];
    }
  });

  return result;
}
