export type PlanCode = 'trial' | 'professional' | 'business';

export interface SubscriptionSummary {
  planCode: PlanCode;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
  currentPeriodEnd: string | null;
}

export interface SiteSummary {
  maxSites: number; // -1 means unlimited
  used: number;
  remaining: number | null;
  unlimited: boolean;
  subscription: SubscriptionSummary;
}

export interface SiteCard {
  id: string;
  name: { en?: string; ar?: string; ku?: string } | string;
  slug: string;
  status: string;
  templateId: string | null;
  updatedAt: string | null;
  itemCount: number;
  orderCount: number;
  categoryCount: number;
}