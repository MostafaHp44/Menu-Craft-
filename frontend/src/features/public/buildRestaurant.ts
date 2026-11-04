import { resolveLang } from '../../shared/i18n';
import { getTemplate } from '../../templates/data/templates';
import type { Restaurant, MenuCategory, MenuItem, OpeningHour, SocialLinks, DesignConfiguration } from '../../shared/lib/types';
import { useMemo } from 'react';
import type { PublicMenuResponse, PublicMenuCategory, PublicMenuItem } from '../../shared/types/public';

function normalizeSocials(s: Record<string, string> | undefined | null): SocialLinks {
  const out = { instagram: '', facebook: '', website: '' };
  if (!s) return out;
  const map: Record<string, keyof SocialLinks> = {
    instagram: 'instagram', insta: 'instagram', ig: 'instagram',
    facebook: 'facebook', fb: 'facebook',
    website: 'website', site: 'website', url: 'website',
  };
  for (const [k, v] of Object.entries(s)) {
    if (v == null) continue;
    const target = map[k.toLowerCase()];
    if (target) out[target] = String(v).trim();
  }
  return out;
}

function buildMenu(menu: PublicMenuCategory[], lang: string): MenuCategory[] {
  return menu.map((cat, ci) => ({
    id: cat.id || `cat-${ci}`,
    name: resolveLang(cat.name, lang) || 'Menu',
    note: resolveLang(cat.note ?? '', lang) || '',
    items: (cat.items || []).map((it: PublicMenuItem, ii: number) => ({
      id: it.id || `item-${ci}-${ii}`,
      name: resolveLang(it.name, lang) || '',
      description: resolveLang(it.description ?? '', lang) || '',
      price: typeof it.price === 'number' ? it.price : 0,
      compareAt: it.compareAt == null ? null : Number(it.compareAt),
      image: it.image || '',
      featured: !!it.featured,
      popular: !!it.popular,
      available: it.available !== false,
    })),
  }));
}

export function buildRestaurant(data: PublicMenuResponse, lang: string): Restaurant {
  const r = data.restaurant;
  const rawDesign = r.design;
  let designObj: Partial<DesignConfiguration> = {};
  if (typeof rawDesign === 'string' && rawDesign) {
    try { designObj = JSON.parse(rawDesign) as Partial<DesignConfiguration>; } catch {}
  } else if (rawDesign && typeof rawDesign === 'object') {
    designObj = (rawDesign as Partial<DesignConfiguration>);
  }
  const tmpl = getTemplate(r.templateId || '');
  const defaultDesign = tmpl.defaultDesign || {};
  const design: DesignConfiguration = {
    colors: { ...defaultDesign.colors, ...designObj.colors },
    typography: { ...defaultDesign.typography, ...designObj.typography },
    layout: { ...defaultDesign.layout, ...designObj.layout },
    sections: Array.isArray(designObj.sections) && designObj.sections.length ? designObj.sections as any : (defaultDesign.sections || [{ id: 'featured', enabled: true }, { id: 'menu', enabled: true }, { id: 'about', enabled: true }, { id: 'gallery', enabled: true }, { id: 'hours', enabled: true }, { id: 'contact', enabled: true }]),
  } as DesignConfiguration;

  const hoursRaw = Array.isArray(r.hours) ? r.hours : [];
  const hours: OpeningHour[] = hoursRaw.map((h: any) => {
    const day = String((h && h.day) || '');
    const open = String((h && h.open) || '');
    const close = String((h && h.close) || '');
    return { day, hours: open && close ? `${open} - ${close}` : (open || close || '') };
  });

  return {
    id: r.id || '',
    name: resolveLang(r.name, lang) || 'Restaurant',
    slug: r.slug || '',
    tagline: resolveLang(r.tagline ?? '', lang) || '',
    description: resolveLang(r.description ?? '', lang) || '',
    logoText: resolveLang(r.logoText ?? '', lang) || '',
    logoStyle: (r.logoStyle as any) || 'monogram',
    heroImage: r.heroImage || '',
    heroVideo: r.heroVideo || '',
    gallery: Array.isArray(r.gallery) ? r.gallery.map(String) : [],
    phone: r.phone || '',
    email: r.email || '',
    address: r.address || '',
    hours,
    socials: normalizeSocials(r.socials as any),
    templateId: r.templateId || 'urban-cafe',
    design,
    menu: buildMenu(data.menu || [], lang),
    status: (r.status === 'published' ? 'published' : 'draft') as 'published' | 'draft',
    plan: 'trial' as any,
    stats: { views: 0, qrScans: 0, trend: [0] },
    updatedAt: r.updatedAt || '',
    copy: (r.copy && typeof r.copy === 'object' ? (r.copy as Record<string, string>) : undefined),
    inline: (r.inline && typeof r.inline === 'object' ? (r.inline as any) : undefined),
  };
}

