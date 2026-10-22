import { CompanyProfile } from '../types/company';

export function showScrapeNotification(company: CompanyProfile) {
  const existing = document.getElementById('jobjockey-scrape-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'jobjockey-scrape-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    background: #0f172a;
    color: #f8fafc;
    border: 1px solid #334155;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    padding: 14px 18px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 320px;
    max-width: 400px;
    animation: jjSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    transition: opacity 0.3s, transform 0.3s;
  `;

  // Inject animation keyframes
  if (!document.getElementById('jobjockey-styles')) {
    const style = document.createElement('style');
    style.id = 'jobjockey-styles';
    style.textContent = `
      @keyframes jjSlideIn {
        from { opacity: 0; transform: translateY(20px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  const scoreColor = company.confidenceScore >= 70 ? '#22c55e' : company.confidenceScore >= 40 ? '#f59e0b' : '#ef4444';

  banner.innerHTML = `
    <div style="width: 36px; height: 36px; border-radius: 8px; background: #16a34a; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; color: #fff; flex-shrink: 0;">
      JJ
    </div>
    <div style="flex: 1; min-width: 0;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
        <strong style="font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 190px; color: #fff;">
          ${company.companyName}
        </strong>
        <span style="font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 9999px; background: rgba(255,255,255,0.1); color: ${scoreColor};">
          ${company.confidenceScore}% Score
        </span>
      </div>
      <div style="color: #94a3b8; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${company.officialEmail !== 'N/A' ? '✉️ ' + company.officialEmail : company.phoneNumber !== 'N/A' ? '📞 ' + company.phoneNumber : company.sourceWebsite}
      </div>
    </div>
    <button id="jobjockey-close-btn" style="background: none; border: none; color: #64748b; font-size: 18px; cursor: pointer; padding: 0 4px; line-height: 1;">
      &times;
    </button>
  `;

  document.body.appendChild(banner);

  const closeBtn = banner.querySelector('#jobjockey-close-btn');
  closeBtn?.addEventListener('click', () => {
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(10px)';
    setTimeout(() => banner.remove(), 300);
  });

  // Auto-dismiss after 4.5 seconds
  setTimeout(() => {
    if (document.body.contains(banner)) {
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(10px)';
      setTimeout(() => banner.remove(), 300);
    }
  }, 4500);
}
