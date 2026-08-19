import { normalizeCellText } from './value-parser.js';

function cleanName(value) {
  return value
    .replace(/\bpanel\b[_\s.]*/gi, '')
    .replace(/\(\s*lead\s*\)/gi, '')
    .replace(/\(\s*\d+(?:\.\d+)?%\s*\)/g, '')
    .replace(/[_\s.]{3,}/g, ' ')
    .replace(/^[-\s,;:]+|[-\s,;:]+$/g, '')
    .trim();
}

export function parseInsurerPanel(value) {
  const raw = normalizeCellText(value).trim();
  if (!raw) return { raw, members: [], confidence: 'LOW', issues: ['MISSING_INSURER'] };

  const parts = raw
    .split(/\r?\n|;|\s{3,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  const members = [];

  for (const part of parts) {
    const percentage = part.match(/\((\d+(?:\.\d+)?)%\)/);
    const sourceName = cleanName(part);
    if (!sourceName || /^panel$/i.test(sourceName)) continue;
    members.push({
      sourceName,
      participationPercent: percentage ? Number(percentage[1]).toFixed(2) : null,
      isLead: /\blead\b/i.test(part),
    });
  }

  if (members.length === 0) {
    members.push({ sourceName: cleanName(raw), participationPercent: null, isLead: false });
  }
  if (members.length === 1 && !members[0].isLead) members[0].isLead = true;

  const issues = [];
  const known = members.filter((member) => member.participationPercent !== null);
  if (known.length === members.length && members.length > 1) {
    const total = known.reduce((sum, member) => sum + Number(member.participationPercent), 0);
    if (Math.abs(total - 100) > 0.1) issues.push('PARTICIPATION_TOTAL');
  }
  if (members.filter((member) => member.isLead).length > 1) issues.push('MULTIPLE_LEADS');
  if (members.length > 1 && !members.some((member) => member.isLead)) issues.push('MISSING_LEAD');

  return {
    raw,
    members,
    confidence: issues.length === 0 ? 'HIGH' : 'LOW',
    issues,
  };
}
