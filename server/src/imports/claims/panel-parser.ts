import { normalizeCellText } from './value-parser.js';

export interface InsurerPanelMember {
  sourceName: string;
  participationPercent: string | null;
  isLead: boolean;
}

export interface InsurerPanelParseResult {
  raw: string;
  members: InsurerPanelMember[];
  confidence: 'HIGH' | 'LOW';
  issues: string[];
}

function cleanName(value: string): string {
  return value
    .replace(/\bpanel\b[_\s.]*/gi, '')
    .replace(/\(\s*lead\s*\)/gi, '')
    .replace(/\(\s*\d+(?:\.\d+)?%\s*\)/g, '')
    .replace(/[_\s.]{3,}/g, ' ')
    .replace(/^[-\s,;:]+|[-\s,;:]+$/g, '')
    .trim();
}

export function parseInsurerPanel(value: unknown): InsurerPanelParseResult {
  const raw = normalizeCellText(value).trim();
  if (!raw) return { raw, members: [], confidence: 'LOW', issues: ['MISSING_INSURER'] };

  const parts = raw
    .split(/\r?\n|;|\s{3,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  const members: InsurerPanelMember[] = [];

  for (const part of parts) {
    const percentage = part.match(/\((\d+(?:\.\d+)?)%\)/);
    const sourceName = cleanName(part);
    if (!sourceName || /^panel$/i.test(sourceName)) continue;
    const pct = percentage?.[1];
    members.push({
      sourceName,
      participationPercent: pct ? Number(pct).toFixed(2) : null,
      isLead: /\blead\b/i.test(part),
    });
  }

  if (members.length === 0) {
    members.push({ sourceName: cleanName(raw), participationPercent: null, isLead: false });
  }
  if (members.length === 1) {
    const first = members[0];
    if (first && !first.isLead) first.isLead = true;
  }

  const issues: string[] = [];
  const known = members.filter((member) => member.participationPercent !== null);
  if (known.length === members.length && members.length > 1) {
    const total = known.reduce((sum, member) => {
      const pct = member.participationPercent;
      return pct !== null ? sum + Number(pct) : sum;
    }, 0);
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
