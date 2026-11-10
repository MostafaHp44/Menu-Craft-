export type PlanCode = 'trial' | 'starter' | 'professional' | 'business';

export interface SiteCard {
  id: string;
  name?: string | null;
  name_en?: string | null;
  name_ar?: string | null;
  name_ku?: string | null;
  slug: string;
  status: string;
  templateId?: string | null;
  updated_at?: string | null;
  itemCount: number;
  categoryCount: number;
}

export interface SitePlanSummary {
  maxSites: number; // -1 means unlimited
  used: number;
  remaining: number | null;
  unlimited: boolean;
  canCreate?: boolean;
  plan?: { id?: string; name?: string; price?: number } | null;
  subscription?: {
    status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
    renewsAt: string | null;
    daysLeft: number | null;
    isTrial: boolean;
  } | null;
}