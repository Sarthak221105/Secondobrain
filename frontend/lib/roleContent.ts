/**
 * Per-role landing-page content.
 *
 * The goal is to make the home page visibly different for each role so
 * employees can see at a glance what this system is useful for given their
 * responsibilities, without needing any indexed documents yet. The content
 * is intentionally static — it does not depend on the backend.
 */

import type { Role } from './role';

export type RoleContent = {
  /** Short headline shown at the top of the role home panel. */
  greeting: string;
  /** One-liner describing what this role uses the search for. */
  blurb: string;
  /** Sources this role typically cares about. Labels only. */
  sources: string[];
  /** Clickable example queries that pre-fill the search box. */
  suggestedQueries: string[];
};

const CONTENT: Record<Role, RoleContent> = {
  engineering: {
    greeting: 'Engineering workspace',
    blurb:
      'Search design docs, postmortems, Slack threads, and Jira tickets across every repo.',
    sources: ['Google Drive', 'Slack', 'Jira', 'Uploads'],
    suggestedQueries: [
      'What is our Q1 search latency target?',
      'Who owns the Pinecone connector?',
      'Recent postmortems about login failures',
      'How do we roll back a Cloud Run deploy?',
    ],
  },
  hr: {
    greeting: 'People Operations',
    blurb: 'Handbooks, policies, onboarding material, and benefits FAQs.',
    sources: ['Google Drive', 'Gmail', 'Uploads'],
    suggestedQueries: [
      'What is the PTO accrual policy?',
      'Remote work eligibility by country',
      'How is parental leave handled?',
      'Onboarding checklist for new hires',
    ],
  },
  sales: {
    greeting: 'Sales enablement',
    blurb: 'Playbooks, competitive intel, battlecards, and account history.',
    sources: ['Google Drive', 'Slack', 'Gmail', 'Uploads'],
    suggestedQueries: [
      'Enterprise discovery call framework',
      'Competitive battlecard vs Acme Corp',
      'How do we handle security questionnaires?',
      'Pricing approval workflow for deals over $100k',
    ],
  },
  finance: {
    greeting: 'Finance & accounting',
    blurb: 'Budgets, forecasts, audit trails, and vendor contracts.',
    sources: ['Google Drive', 'Gmail', 'Uploads'],
    suggestedQueries: [
      'FY26 operating budget breakdown',
      'Cloud infra spend trend last 4 quarters',
      'Vendor payment terms for AWS',
      'Travel & expense policy thresholds',
    ],
  },
  executive: {
    greeting: 'Executive cockpit',
    blurb:
      'Board materials, strategy documents, and org-wide announcements across every source.',
    sources: ['Google Drive', 'Slack', 'Gmail', 'Jira', 'Uploads'],
    suggestedQueries: [
      'Latest board update highlights',
      'Cross-functional OKR status',
      'Revenue targets vs actuals this quarter',
      'Top customer escalations this month',
    ],
  },
  admin: {
    greeting: 'Admin view',
    blurb:
      'You can see every document in the index. Use the Admin page to upload files, assign roles, and review audit logs.',
    sources: ['All sources'],
    suggestedQueries: [
      'Most recently indexed documents',
      'Confidential budget planning',
      'Discovery call framework',
      'PTO policy details',
    ],
  },
};

export function contentFor(role: Role | null | undefined): RoleContent {
  if (role && role in CONTENT) return CONTENT[role as Role];
  return CONTENT.engineering;
}
