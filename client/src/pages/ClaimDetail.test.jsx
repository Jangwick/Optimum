import { describe, expect, it } from 'vitest';
import { CLAIM_DETAIL_TABS } from './ClaimDetail.jsx';

describe('ClaimDetail tabs', () => {
  it('does not include Timeline or Tasks', () => {
    const labels = CLAIM_DETAIL_TABS.map((tab) => tab.label);

    expect(labels).not.toContain('Timeline');
    expect(labels).not.toContain('Tasks');
  });
});
