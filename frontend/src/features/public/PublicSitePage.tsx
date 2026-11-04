/**
 * صفحة الموقع العام للعميل النهائي — /site/:slug
 * ------------------------------------------------------------
 * واجهة الضيف الحقيقية (Phase 1 Task 01):
 *  - تجلب المنيو المنشور من GET /api/public/menu/:slug (بلا مصادقة).
 *  - تُحدد المطعم تلقائيًا من الـ slug — الضيف لا يُدخل معرّفات يدويًا.
 *  - رابط QR: ?table=5&mode=dinein&lang=ar يضبط الطاولة/الوضع/اللغة.
 *  - كل بطاقة/صف صنف فيه زر «أضف» — لا مغادرة للصفحة للإضافة.
 *    أصناف ذات خيارات إلزامية تفتح نافذة التخصيص قبل الإضافة.
 *  - الفرع: فروع حقيقية من GET /api/public/menu/:slug/branches مع
 *    علم acceptingOrders — الفرع المغلق يمنع الطلب (يظل التصفح متاحًا).
 *  - السلة: features/public/publicCart.ts (مرتبطة بالمطعم، بلا خلط،
 *   دمج نفس البصمة، استمرار localStorage بنفس المفاتيح).
 *  - الطلب: POST /api/orders عبر guestOrderAPI — قناة online،
 *    التسعير النهائي في الخادم، ثم تتبع برمز orderToken.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { resolveLang, useI18n, type Lang } from '../../shared/i18n';
import { guestOrderAPI, menuAPI } from '../../shared/lib/api.service';
import type {
  PublicBranch,
  PublicMenuItem,
  PublicMenuItemOptionGroup,
  PublicMenuResponse,
} from '../../shared/types/public';
import {
  cartSignature,
  useCartStore,
  type CartOptionSel,
} from './publicCart';
import { RestaurantSite } from '../../templates/site/RestaurantSite.tsx';
import { buildRestaurant } from './buildRestaurant';

/* ------------------------------------------------------------------ */
/* مساعدات                                                              */
/* ------------------------------------------------------------------ */

function fmtPrice(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency || 'USD'}`;
}

/** الحد الأقصى للاختيارات داخل مجموعة (الافتراضي 1) */
function groupMax(group: PublicMenuItemOptionGroup): number {
  return group.max ?? 1;
}

/** ضيف الـ QR: قراءة باراميترات الرابط مرة واحدة */
interface DeepLink {
  table: string;
  lang: string | null;
}

/* ------------------------------------------------------------------ */
/* الحالة العامة للصفحة                                                 */
/* ------------------------------------------------------------------ */

type Overlay = 'closed' | 'cart' | 'checkout' | 'success';

interface OrderResult {
  id: string;
  number: number;
  token: string;
  total: number;
  currency: string;
  paymentMethod?: string;
}

export default function PublicSitePage() {
  const { slug = '' } = useParams();
  const [search] = useSearchParams();
  const { t, lang, setLang } = useI18n();

  const [data, setData] = useState<PublicMenuResponse | null>(null);
  const [branches, setBranches] = useState<PublicBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* السلة */
  const cart = useCartStore();
  const [overlay, setOverlay] = useState<Overlay>('closed');
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  /* تخصيص صنف */
  const [customizeItem, setCustomizeItem] = useState<PublicMenuItem | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>('all');

  /* QR deep link?table=&mode=dinein&lang= — يُقرأ مرة */
  const deepLink = useMemo<DeepLink>(() => ({
    table: search.get('table') || '',
    lang: search.get('lang'),
  }), [search]);

  const load = () => {
    setLoading(true);
    setError(null);
    setData(null);
    menuAPI.getPublicMenu(slug).then((menu) => {
      setData(menu);
      setLoading(false);
    }).catch((e: { status?: number; message?: string }) => {
      setError(e?.status === 404 ? '404' : (e?.message || 'error'));
      setLoading(false);
    });
    menuAPI.getPublicBranches(slug).then(setBranches).catch(() => setBranches([]));
  };

  useEffect(load, [slug]);

  /* lang من الرابط (QR) — مرة واحدة عند فتح الصفحة */
  useEffect(() => {
    const requested = deepLink.lang;
    if (requested === 'ar' || requested === 'en' || requested === 'ku') {
      if (requested !== lang) setLang(requested as Lang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* الفروع: فرع مختار من السلة (محفوظ) أو الافتراضي */
  const selectedBranch = useMemo<PublicBranch | null>(() => {
    if (branches.length === 0) return null;
    return branches.find((b) => b.id === cart.branchId) ?? branches[0] ?? null;
  }, [branches, cart.branchId]);
  /** الفرع المختار يقبل الطلبات؟ (بلا فروع = ي governed توسطت إعدادات المطعم) */
  const branchAcceptsOrders = branches.length === 0 ? true : Boolean(selectedBranch?.acceptingOrders);
  const restaurantAcceptsOrders = Boolean(data && data.ordering.enabled);

  /** الطلب العام متاح لهذا المطعم/الفرع */
  const orderingOpen = restaurantAcceptsOrders && branchAcceptsOrders;

  const doAdd = (item: PublicMenuItem, options: CartOptionSel[], note = '') => {
    if (!data) return;
    cart.add({
      restaurantId: data.restaurant.id,
      slug,
      restaurantName: resolveLang(data.restaurant.name, lang),
      item,
      displayName: resolveLang(item.name, lang),
      options,
      note,
    });
    setCustomizeItem(null);
    setJustAdded(item.id);
    window.setTimeout(() => setJustAdded(null), 1400);
  };

  const restaurantObj = useMemo(() => buildRestaurant(data || { restaurant: { id: '', name: '', slug: '', templateId: 'urban-cafe', design: {} as any, menu: [], ordering: {} as any } } as any, lang), [data, lang]);

  /* ------------------------------------------------------------------ */
  /* حالات التحميل/الخطأ                                                  */
  /* ------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="min-h-dvh bg-offwhite text-ink-ink flex items-center justify-center" dir={lang === 'en' ? 'ltr' : 'rtl'}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-ink-soft">{t('publicUi.loading')}</p>
        </div>
      </div>
    );
  }

  if (error === '404' || !data) {
    return (
      <div className="min-h-dvh bg-offwhite text-ink-ink flex items-center justify-center px-6" dir={lang === 'en' ? 'ltr' : 'rtl'}>
        <div className="text-center max-w-sm">
          <p className="font-display text-4xl font-semibold text-ink-ink">{t('publicUi.notFoundTitle')}</p>
          <p className="mt-2 text-sm text-ink-soft">{t('publicUi.notFoundSub')}</p>
          <button onClick={load} className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition">
            {t('publicUi.retry')}
          </button>
        </div>
      </div>
    );
  }

  const currency = data ? (data.ordering.currency || 'USD') : 'USD';

  return (
    <div className="min-h-dvh" dir={lang === 'en' ? 'ltr' : 'rtl'}>
      <RestaurantSite restaurant={restaurantObj} mode="site" interactive={true}
        onOpenCart={() => { setOverlay('cart'); }} />

      {/* branch bar kept from original */}
      {branches.length > 0 && (
        <BranchBar
          branches={branches}
          selectedId={selectedBranch?.id ?? ''}
          onSelect={(id) => cart.setBranch(id)}
          lang={lang}
          acceptsOrders={branchAcceptsOrders}
        />
      )}
      {branches.length > 0 && !branchAcceptsOrders && (
        <div className="mx-auto max-w-5xl px-4 pt-3">
          <div className="rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-[13px] text-ink-soft">
            {t('publicUi.branchClosedNote')}
          </div>
        </div>
      )}

      {/* ordering closed banner */}
      {!restaurantAcceptsOrders && (
        <div className="bg-white border-y border-sand/70 px-4 py-3 text-center text-[13px] text-ink-soft">
          {t('publicUi.orderingClosed')}
        </div>
      )}

      {/* floating cart bar */}
      {cart.count > 0 && overlay === 'closed' && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand/70 bg-white/95 backdrop-blur px-4 py-3">
          <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
            <div className="text-[13px]">
              <span className="font-semibold text-ink-ink">{t('publicUi.cartTitle')}</span>
              <span className="ms-2 text-ink-soft">{cart.count} · {fmtPrice(cart.subtotal, currency)}</span>
            </div>
            <button
              onClick={() => setOverlay('checkout')}
              disabled={!orderingOpen}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-primary-dark transition"
            >
              {t('publicUi.checkoutBtn')}
            </button>
          </div>
        </div>
      )}

      {overlay === 'cart' && (
        <CartDrawer
          currency={currency}
          deliveryFee={data.ordering.deliveryFee}
          minOrder={data.ordering.minOrder}
          fulfillmentOptions={data.ordering.fulfillment}
          tableFromLink={deepLink.table}
          onClose={() => setOverlay('closed')}
          onGoCheckout={() => setOverlay('checkout')}
        />
      )}
      {overlay === 'checkout' && data && (
        <CheckoutOverlay
          slug={slug}
          restaurantId={data.restaurant.id}
          currency={currency}
          branches={branches}
          branchId={selectedBranch?.id ?? cart.branchId}
          branchName={selectedBranch ? resolveLang(selectedBranch.name, lang) : ''}
          deliveryFee={data.ordering.deliveryFee}
          minOrder={data.ordering.minOrder}
          fulfillmentOptions={data.ordering.fulfillment}
          paymentMethods={data.ordering.paymentMethods}
          tableFromLink={deepLink.table}
          onClose={() => setOverlay('closed')}
          onPlaced={(res) => {
            setOrderResult(res);
            setOverlay('success');
            cart.clear();
          }}
        />
      )}
      {overlay === 'success' && orderResult && (
        <OrderSuccess
          result={orderResult}
          onClose={() => {
            setOrderResult(null);
            setOverlay('closed');
          }}
        />
      )}

      {customizeItem && (
        <CustomizeModal
          item={customizeItem}
          currency={currency}
          lang={lang}
          onConfirm={(options, note) => doAdd(customizeItem, options, note)}
          onClose={() => setCustomizeItem(null)}
        />
      )}
    </div>
  );
}

/** مجموع كمية صنف في السلة (لكل سطوره) */


/* ------------------------------------------------------------------ */
/* الرأس                                                                */
/* ------------------------------------------------------------------ */

// function PublicHeader(props: {
//   name: string;
//   logoText: string;
//   tagline: string;
//   heroImage: string;
//   onOpenCart: () => void;
//   cartCount: number;
//   cartSubtotal: number;
//   currency: string;
// }) {
//   const { t } = useI18n();
//   return (
//     <header className="relative overflow-hidden bg-ink-ink text-white">
//       {props.heroImage ? (
//         <div
//           className="absolute inset-0 opacity-30 bg-cover bg-center"
//           style={{ backgroundImage: `url(${props.heroImage})` }}
//           aria-hidden
//         />
//       ) : null}
//       <div className="relative mx-auto max-w-5xl px-4 pt-5 pb-9">
//         <div className="flex items-start justify-between gap-3">
//           <div className="flex items-center gap-3 min-w-0">
//             <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-[15px] font-bold uppercase">
//               {(props.logoText || props.name || 'DM').slice(0, 2).toUpperCase()}
//             </span>
//             <div className="min-w-0">
//               <h1 className="font-display text-lg font-semibold leading-tight truncate">{props.name}</h1>              <p className="text-[12px] text-white/70 truncate">{props.tagline || t('publicUi.brandTag')}</p>
//             </div>
//           </div>
//           <LangSwitcher onLight />
//         </div>

//         {/* زر السلة */}
//         <button
//           onClick={props.onOpenCart}
//           className="absolute bottom-5 end-4 flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-ink shadow-lg shadow-black/20 transition hover:scale-[1.02]"
//         >
//           <CartIcon className="h-4.5 w-4.5" />
//           {t('publicUi.cartBtn')}
//           {props.cartCount > 0 && (
//             <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
//               {props.cartCount}
//             </span>
//           )}
//           {props.cartCount > 0 && (
//             <span className="text-[12px] text-ink-soft">{fmtPrice(props.cartSubtotal, props.currency)}</span>
//           )}
//         </button>
//       </div>
//     </header>
//   );
// }

// function LangSwitcher({ onLight = false }: { onLight?: boolean }) {
//   const { lang, setLang, t } = useI18n();
//   return (
//     <div className="flex items-center gap-1" role="group" aria-label={t('publicUi.languageAria')}>
//       {LANGS.map((l) => (
//         <button
//           key={l.id}
//           onClick={() => setLang(l.id)}
//           aria-pressed={lang === l.id}
//           className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition ${
//             lang === l.id
//               ? onLight ? 'bg-white text-ink-ink' : 'bg-primary text-white'
//               : onLight ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-sand text-ink-soft hover:bg-stone'
//           }`}
//         >
//           {l.id === 'en' ? 'EN' : l.id === 'ar' ? 'ع' : 'کu'}
//         </button>
//       ))}
//     </div>
//   );
// }

function CartIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* شريط الفروع                                                          */
/* ------------------------------------------------------------------ */

function BranchBar(props: {
  branches: PublicBranch[];
  selectedId: string;
  onSelect: (id: string) => void;
  lang: Lang;
  acceptsOrders: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="border-b border-sand/70 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-ink-soft">{t('publicUi.branchLabel')}</span>
          {props.branches.map((b) => {
            const active = b.id === props.selectedId;
            const disabled = !b.acceptingOrders && !active;
            return (
              <button
                key={b.id}
                onClick={() => props.onSelect(b.id)}
                disabled={disabled}
                title={!b.acceptingOrders ? t('publicUi.branchClosed') : undefined}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition ${
                  active
                    ? 'border-primary bg-primary/10 text-ink-ink'
                    : 'border-sand text-ink-soft hover:border-stone'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {resolveLang(b.name, props.lang) || t('publicUi.branchDefault')}
                {!b.acceptingOrders && (
                  <span className="rounded-full bg-ink-ink/10 px-1.5 py-0.5 text-[10px] text-ink-soft">
                    {t('publicUi.branchClosed')}
                  </span>
                )}
                {active && b.acceptingOrders && (
                  <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* المنيو: تصنيفات + شبكة + قائمة                                        */
/* ------------------------------------------------------------------ */

/* Labels removed — menu is rendered by RestaurantSite now */
/* ------------------------------------------------------------------ */

function CustomizeModal(props: {
  item: PublicMenuItem;
  currency: string;
  lang: Lang;
  onConfirm: (options: CartOptionSel[], note: string) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const groups = props.item.options?.groups ?? [];
  /** خيارات مختارة: groupId → optionId[] */
  const [chosen, setChosen] = useState<Record<string, string[]>>(() => {
    const pre: Record<string, string[]> = {};
    for (const g of groups) {
      if ((g.required || (g.min ?? 0) > 0) && g.max === 1 && g.options[0] && g.options.length === 1) {
        pre[g.id] = [g.options[0].id ?? ''];
      }
    }
    return pre;
  });
  const [note, setNote] = useState('');
  const [missing, setMissing] = useState<string | null>(null);

  const toggle = (group: PublicMenuItemOptionGroup, optionId: string) => {
    setChosen((prev) => {
      const current = prev[group.id] ?? [];
      const max = groupMax(group);
      if (current.includes(optionId)) {
        const next = current.filter((o) => o !== optionId);
        return { ...prev, [group.id]: next };
      }
      if (max === 1) return { ...prev, [group.id]: [optionId] };
      if (current.length >= max) return prev;
      return { ...prev, [group.id]: [...current, optionId] };
    });
    setMissing(null);
  };

  const confirm = () => {
    const selections: CartOptionSel[] = [];
    for (const g of groups) {
      for (const optionId of chosen[g.id] ?? []) {
        const option = g.options.find((o) => o.id === optionId);
        if (!option) continue;
        selections.push({
          groupId: g.id,
          groupName: resolveLang(g.name, props.lang),
          optionId,
          optionName: resolveLang(option.name, props.lang),
        });
      }
    }
    // فرض الإلزامي قبل الإضافة
    for (const g of groups) {
      const count = (chosen[g.id] ?? []).length;
      const min = g.min ?? (g.required ? 1 : 0);
      if (count < min) {
        setMissing(`${resolveLang(g.name, props.lang)}`);
        return;
      }
    }
    props.onConfirm(selections, note.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal>
      <button className="absolute inset-0 bg-ink-ink/50 backdrop-blur-sm" onClick={props.onClose} aria-label="close" tabIndex={-1} />
      <div className="relative z-10 w-full sm:max-w-md max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl anim-pop">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">{resolveLang(props.item.name, props.lang)}</h3>
            <p className="text-[12px] text-ink-soft">{t('publicUi.customizeSub')}</p>
          </div>
          <button onClick={props.onClose} className="rounded-full bg-sand px-2.5 py-1 text-[12px] font-semibold text-ink-soft" aria-label="close">✕</button>
        </div>

        <div className="mt-4 space-y-4">
          {groups.map((g) => (
            <div key={g.id}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-[13px] font-semibold">{resolveLang(g.name, props.lang)}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${g.required ? 'bg-primary/10 text-primary-dark' : 'bg-sand text-ink-soft'}`}>
                  {g.required ? t('publicUi.requiredTag') : t('publicUi.optionalTag')}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {g.options.map((o) => {
                  const optionId = o.id ?? resolveLang(o.name, props.lang);
                  const active = (chosen[g.id] ?? []).includes(optionId);
                  return (
                    <button
                      key={optionId}
                      onClick={() => toggle(g, optionId)}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition ${
                        active ? 'border-primary bg-primary/10 text-ink-ink' : 'border-sand text-ink-soft hover:border-stone'
                      }`}
                    >
                      {resolveLang(o.name, props.lang)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <label className="text-[13px] font-semibold" htmlFor="pub-note">{t('publicUi.noteLabel')}</label>
            <textarea
              id="pub-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder={t('publicUi.notePh')}
              className="mt-1 w-full resize-none rounded-xl border border-sand bg-offwhite/60 px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>

          {missing && (
            <p className="rounded-lg bg-rose/10 px-3 py-2 text-[12px] text-rose-dark">✕ {missing}</p>
          )}
        </div>

        <button
          onClick={confirm}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-[14px] font-bold text-white hover:bg-primary-dark transition active:scale-[0.99]"
        >
          {t('publicUi.confirmAdd')} · {fmtPrice(props.item.price, props.currency)}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* درج السلة                                                            */
/* ------------------------------------------------------------------ */

function CartDrawer(props: {
  currency: string;
  deliveryFee: number;
  minOrder: number;
  fulfillmentOptions: { delivery: boolean; pickup: boolean };
  tableFromLink: string;
  onClose: () => void;
  onGoCheckout: () => void;
}) {
  const { t } = useI18n();
  const cart = useCartStore();
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal>
      <button className="absolute inset-0 bg-ink-ink/50 backdrop-blur-sm" onClick={props.onClose} aria-label="close" tabIndex={-1} />
      <div className="relative z-10 w-full sm:max-w-md max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl anim-pop">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{t('publicUi.cartTitle')}</h3>
          <button onClick={props.onClose} className="rounded-full bg-sand px-2.5 py-1 text-[12px] font-semibold text-ink-soft" aria-label="close">✕</button>
        </div>

        {cart.lines.length === 0 ? (
          <div className="py-10 text-center">
            <CartIcon className="mx-auto h-9 w-9 text-clay" />
            <p className="mt-3 font-semibold text-ink-ink">{t('publicUi.cartEmpty')}</p>
            <p className="mt-1 text-[12.5px] text-ink-soft">{t('publicUi.cartEmptySub')}</p>
            <button onClick={props.onClose} className="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition">
              {t('publicUi.browseMenu')}
            </button>
          </div>
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {cart.lines.map((line) => {
                const sig = cartSignature(line);
                return (
                  <li key={`${line.itemId}-${sig}`} className="flex items-start gap-3 border-b border-sand/60 pb-3 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold">{line.name}</p>
                      {line.options.length > 0 && (
                        <p className="text-[11.5px] text-ink-soft">{line.options.map((o) => o.optionName).join(' · ')}</p>
                      )}
                      {line.note ? <p className="text-[11px] text-clay">✎ {line.note}</p> : null}
                      <p className="mt-0.5 text-[12px] text-ink-soft">
                        {fmtPrice(line.price, props.currency)} × {line.qty} = <strong className="text-ink-ink">{fmtPrice(line.qty * line.price, props.currency)}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <QtyButton label="−" onClick={() => cart.setQty(line.itemId, sig, line.qty - 1)} />
                      <span className="w-6 text-center text-[13px] font-bold">{line.qty}</span>
                      <QtyButton label="+" onClick={() => cart.setQty(line.itemId, sig, line.qty + 1)} />
                      <button
                        onClick={() => cart.remove(line.itemId, sig)}
                        className="ms-1 text-[11.5px] font-medium text-rose-dark hover:underline"
                      >
                        {t('publicUi.remove')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 rounded-xl bg-offwhite/70 px-3.5 py-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-ink-soft">{t('publicUi.subtotalLabel')}</span>
                <span className="font-bold">{fmtPrice(cart.subtotal, props.currency)}</span>
              </div>
              {props.minOrder > 0 && cart.subtotal < props.minOrder && (
                <p className="mt-1.5 text-[12px] text-amber-dark">
                  {t('publicUi.minOrderNote', { min: props.minOrder, currency: props.currency })}
                </p>
              )}
            </div>

            <button
              onClick={props.onGoCheckout}
              className="mt-4 w-full rounded-full bg-primary py-3 text-[14px] font-bold text-white hover:bg-primary-dark transition"
            >
              {t('publicUi.checkoutBtn')} · {fmtPrice(cart.subtotal, props.currency)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function QtyButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-full bg-sand/70 text-[14px] font-bold text-ink-ink transition hover:bg-stone active:scale-95"
      aria-label={label}
    >
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* إتمام الطلب                                                          */
/* ------------------------------------------------------------------ */

type Fulfillment = 'delivery' | 'pickup' | 'table';

export function CheckoutOverlay(props: {
  slug: string;
  restaurantId: string;
  currency: string;
  branches: PublicBranch[];
  branchId: string;
  branchName: string;
  deliveryFee: number;
  minOrder: number;
  fulfillmentOptions: { delivery: boolean; pickup: boolean };
  paymentMethods: Array<{ code: string; label: string }>;
  tableFromLink: string;
  onClose: () => void;
  onPlaced: (res: OrderResult) => void;
}) {
  const { t } = useI18n();
  const cartSub = useCartStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup');
  const [table, setTable] = useState(props.tableFromLink);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(props.paymentMethods[0]?.code ?? 'cash');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* من الرابط ?mode=dinein نضبط table مسبقًا — الفئة تُحدد مرتين: القيمة الأصلية ثم الرابط */
  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get('mode');
    if (mode === 'dinein' || mode === 'table') setFulfillment('table');
    else if (mode === 'delivery' && props.fulfillmentOptions.delivery) setFulfillment('delivery');
    else if (mode === 'pickup' && props.fulfillmentOptions.pickup) setFulfillment('pickup');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* عند تبديل الاستلام، اختر وسيلة دفع مناسبة تلقائيًا */
  useEffect(() => {
    const list = fulfillment === 'delivery' ? onlineMethods : methods;
    if (list.length && !list.find((m) => m.code === paymentMethod)) {
      setPaymentMethod(list[0].code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fulfillment]);

  /* لا وسائل دفع جاهزة → خيار افتراضي without تسليم */
  const methods = props.paymentMethods.length > 0 ? props.paymentMethods : [{ code: 'cash', label: 'Cash' }];
  const onlineCodes = new Set(['card', 'wallet']);
  const onlineMethods = methods.filter((m) => onlineCodes.has(m.code));
  const activePaymentMethods = fulfillment === 'delivery' ? onlineMethods : methods;
  const deliveryAllowed = props.fulfillmentOptions.delivery && onlineMethods.length > 0;

  const subtotal = cartSub.subtotal;
  const deliveryFee = fulfillment === 'delivery' ? props.deliveryFee : 0;
  const total = Math.max(0, subtotal + deliveryFee);

  const submit = async () => {
    setFormError(null);
    if (subtotal <= 0) { setFormError(t('publicUi.orderFailed')); return; }
    if (name.trim().length < 2) {
      setFormError(t('publicUi.orderFailed'));
      return;
    }
    if (phone.trim().length < 5) {
      setFormError(t('publicUi.orderFailed'));
      return;
    }
    if (fulfillment === 'delivery' && (!deliveryAllowed || activePaymentMethods.length === 0)) {
      setFormError('Delivery requires online payment (card or wallet). Configure it in the restaurant ordering settings first.');
      return;
    }
    if (fulfillment === 'delivery' && address.trim().length < 5) {
      setFormError(t('publicUi.orderFailed'));
      return;
    }
    setSending(true);
    try {
      // كتم منع التكرار (نقر مزدوج) — broadcastChannel مستوى هذا المتصفح
      const idempotencyKey = cryptoRandomKey();
      /* مطابقة عملية createOrderSchema في الخادم حرفيًا:
         - قناة online (الافتراضية) — لا نرسل channel أصلًا
         - خصائص الخيارات نصية فقط (بلا تعديل سعر) لكن نفوّرها
           كأزواج groupId/optionId صالحة يتحقق منها الخادم */
      const lines = cartSub.lines.map((line) => ({
        itemId: line.itemId,
        qty: line.qty,
        options: line.options.map((o) => ({ groupId: o.groupId, optionId: o.optionId })),
      }));
      const payload = {
        restaurantId: props.restaurantId,
        slug: props.slug,
        customer: {
          name: name.trim(),
          phone: phone.trim(),
        },
        fulfillment,
        deliveryAddress: fulfillment === 'delivery' ? address.trim() : undefined,
        table: fulfillment === 'table' ? (table.trim() || props.tableFromLink || '1') : undefined,
        note: note.trim() || undefined,
        paymentMethod,
        lines,
        idempotencyKey,
      };
      const res = await guestOrderAPI.create(payload);
      if (res?.ok && res?.data?.id) {
        props.onPlaced({
          id: res.data.id,
          number: res.data.number,
          token: res.data.orderToken ?? '',
          total: res.data.total,
          currency: res.data.currency ?? props.currency,
          paymentMethod,
        });
      } else {
        setFormError(t('publicUi.orderFailed'));
      }
    } catch (e) {
      setFormError(e instanceof Error && e.message ? e.message : t('publicUi.orderFailed'));
    } finally {
      setSending(false);
    }
  };

  const deliveryEnabled = props.fulfillmentOptions.delivery;
  const pickupEnabled = props.fulfillmentOptions.pickup;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal>
      <button className="absolute inset-0 bg-ink-ink/50 backdrop-blur-sm" onClick={props.onClose} aria-label="close" tabIndex={-1} />
      <div className="relative z-10 w-full sm:max-w-md max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl anim-pop">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{t('publicUi.checkoutTitle')}</h3>
          <button onClick={props.onClose} className="rounded-full bg-sand px-2.5 py-1 text-[12px] font-semibold text-ink-soft" aria-label="close">✕</button>
        </div>

        <div className="mt-4 space-y-4">
          {/* الاسم/الهاتف */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('publicUi.nameLabel')}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('publicUi.namePh')} autoComplete="name" className={inputCls} />
            </Field>
            <Field label={t('publicUi.phoneLabel')}>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('publicUi.phonePh')} inputMode="tel" autoComplete="tel" className={inputCls} />
            </Field>
          </div>

          {/* الاستلام */}
          <Field label={t('publicUi.fulfillmentLabel')}>
            <div className="flex flex-wrap gap-2">
              {deliveryEnabled && (
                <Choice disabled={!deliveryAllowed} active={fulfillment === 'delivery'} onClick={() => setFulfillment('delivery')}>{t('publicUi.delivery')}</Choice>
              )}
              {!deliveryAllowed && deliveryEnabled && (
                <span className="text-[12px] font-medium text-ink-soft">Delivery requires online payment</span>
              )}
              {pickupEnabled && (
                <Choice active={fulfillment === 'pickup'} onClick={() => setFulfillment('pickup')}>{t('publicUi.pickup')}</Choice>
              )}
              <Choice active={fulfillment === 'table'} onClick={() => setFulfillment('table')}>{t('publicUi.dinein')}</Choice>
            </div>
          </Field>

          {fulfillment === 'table' && (
            <Field label={t('publicUi.tableLabel')}>
              <input value={table} onChange={(e) => setTable(e.target.value)} inputMode="numeric" className={inputCls} placeholder="12" />
            </Field>
          )}
          {fulfillment === 'delivery' && (
            <Field label={t('publicUi.addressLabel')}>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder={t('publicUi.addressPh')} className={`${inputCls} resize-none`} />
            </Field>
          )}

          {/* وسائل الدفع */}
          <Field label={t('publicUi.payLabel')}>
            <div className="flex flex-wrap gap-2">
              {activePaymentMethods.map((m) => (
                <Choice key={m.code} active={paymentMethod === m.code} onClick={() => setPaymentMethod(m.code)}>{m.label}</Choice>
              ))}
              {activePaymentMethods.length === 0 && (
                <span className="text-[12px] font-medium text-ink-soft">No online payment is configured for delivery.</span>
              )}
            </div>
          </Field>

          <Field label={t('publicUi.orderNoteLabel')}>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} className={`${inputCls} resize-none`} />
          </Field>

          {/* الملخص */}
          <div className="rounded-xl bg-offwhite/70 px-3.5 py-3 text-[13px]">
            <div className="flex justify-between">
              <span className="text-ink-soft">{t('publicUi.subtotalLabel')}</span>
              <span>{fmtPrice(subtotal, props.currency)}</span>
            </div>
            {fulfillment === 'delivery' && props.deliveryFee > 0 && (
              <div className="mt-1 flex justify-between text-ink-soft">
                <span>{t('publicUi.deliveryFeeLabel')}</span>
                <span>{fmtPrice(props.deliveryFee, props.currency)}</span>
              </div>
            )}
            <div className="mt-1.5 flex justify-between border-t border-sand pt-1.5 font-bold">
              <span>{t('publicUi.totalLabel')}</span>
              <span>{fmtPrice(total, props.currency)}</span>
            </div>
          </div>

          {props.minOrder > 0 && subtotal < props.minOrder && (
            <p className="rounded-lg bg-amber/15 px-3 py-2 text-[12px] text-amber-dark">
              {t('publicUi.minOrderNote', { min: props.minOrder, currency: props.currency })}
            </p>
          )}

          {formError && (
            <p className="rounded-lg bg-rose/10 px-3 py-2 text-[12.5px] font-medium text-rose-dark">✕ {formError}</p>
          )}

          <button
            onClick={submit}
            disabled={sending || subtotal <= 0 || (props.minOrder > 0 && subtotal < props.minOrder)}
            className={`w-full rounded-full py-3 text-[14px] font-bold transition ${
              sending ? 'bg-primary/70 text-white' : 'bg-primary text-white hover:bg-primary-dark active:scale-[0.99]'
            } disabled:opacity-60`}
          >
            {sending ? t('publicUi.placing') : t('publicUi.placeOrder')}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-sand bg-offwhite/50 px-3 py-2.5 text-[13.5px] outline-none transition focus:border-primary focus:bg-white';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-semibold text-ink-ink">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function Choice({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className={`rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition ${
        disabled ? 'cursor-not-allowed opacity-40 border-sand text-ink-soft' : active ? 'border-primary bg-primary/10 text-ink-ink' : 'border-sand text-ink-soft hover:border-stone'
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* نجاح الطلب                                                           */
/* ------------------------------------------------------------------ */

function OrderSuccess(props: { result: OrderResult; onClose: () => void }) {
  const { t } = useI18n();
  const isCash = props.result.paymentMethod === 'cash' || props.result.paymentMethod === 'cash_at_pickup';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-ink-ink/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl anim-pop">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12 4 4L19 6" />
          </svg>
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold">
          {isCash ? 'Order sent to cashier' : t('publicUi.orderConfirmed')}
        </h3>
        <p className="mt-1 text-[13px] text-ink-soft">
          {t('publicUi.orderNumber', { number: props.result.number })}
        </p>
        <p className="mt-1 text-[13px] text-ink-ink font-bold">
          {isCash ? 'Amount due at cashier' : t('publicUi.totalPaid')}: {fmtPrice(props.result.total, props.result.currency)}
        </p>
        <p className="mt-2 text-[12px] text-ink-soft">
          {isCash
            ? 'Please go to the cashier at your chosen branch to pay. The cashier will confirm once payment is received.'
            : t('publicUi.thanksNote')}
        </p>
        {props.result.token ? (
          <Link
            to={`/orders/${encodeURIComponent(props.result.id)}?token=${encodeURIComponent(props.result.token)}`}
            className="mt-6 block w-full rounded-full bg-primary py-3 text-[14px] font-bold text-white hover:bg-primary-dark transition"
          >
            {t('publicUi.trackOrder')}
          </Link>
        ) : null}
        <button onClick={props.onClose} className="mt-2 w-full rounded-full border border-sand py-2.5 text-[13px] font-semibold text-ink-soft hover:bg-sand/50 transition">
          ✕
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function cryptoRandomKey(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fallthrough */
  }
  return `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
