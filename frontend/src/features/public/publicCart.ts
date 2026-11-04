/**
 * سلة الزائر العام — features/public/publicCart.ts
 * ------------------------------------------------------------
 * قواعد معتمدة (Phase 1 Task 01):
 *  - السلة مرتبطة بمطعم واحد: منتجات مطاعم مختلفة لا تختلط أبدًا —
 *    الانتقال إلى مطعم آخر يستبدل السلة (لا يخلط).
 *  - الاستمرارية عبر localStorage بنفس المفتاح القائم (`cart_items`)
 *    ومفتاح الفرع (`cart_branch`) — لا تُمسح بيانات الزائر، ولا يُكتب
 *    مفتاح `cart_mode` القديم (وضع الاستلام يُدار في الـ checkout).
 *  - سطر السلة معرَّف بـ (itemId + بصمة الاختيارات):
 *    نفس المنتج + نفس الاختيارات → تزايد الكمية في نفس السطر.
 *    اختيارات مختلفة → سطران منفصلان.
 *  - الإضافات نصّية فقط (قرار معتمد) — لا تعديل أسعار عبر الخيارات.
 *  - الإضافة/التحديث/الإزالة تُزامنان الإجماليات فورًا.
 */
import { create } from 'zustand';
import type { PublicMenuItem, PublicMenuItemOptionGroup } from '../../shared/types/public';

const CART_ITEMS_KEY = 'cart_items';
const CART_BRANCH_KEY = 'cart_branch';
/** الحد الأعلى لكل سطر — مطابق لتحقق الخادم (1..50) */
const MAX_QTY_PER_LINE = 50;

/* ------------------------------------------------------------------ */
/* أنواع السلة                                                          */
/* ------------------------------------------------------------------ */

export interface CartOptionSel {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
}

export interface CartLine {
  /** itemId — مطابق MenuItems.id في الخادم */
  itemId: string;
  name: string;
  /** السعر الأساسي للمنتج (التسعير النهائي يُعاد في الخادم دائمًا) */
  price: number;
  qty: number;
  /** اختيارات مطابقة بالأسماء — بدون أسعار إضافية (قرار معتمد) */
  options: CartOptionSel[];
  /** ملاحظة نصية حرّة للسطر (بديل الإضافات) */
  note: string;
}

export interface CartState {
  /** المطعم الذي تنتمي إليه السلة (لا مخالطة بين المطاعم) */
  restaurantId: string | null;
  slug: string | null;
  restaurantName: string;
  lines: CartLine[];
  /** الفرع المختار — يُحفظ بمفتاح cart_branch القائم */
  branchId: string;
}

function optionsKey(options: Array<Pick<CartOptionSel, 'groupId' | 'optionId'>>): string {
  return [...options].map((o) => `${o.groupId}:${o.optionId}`).sort().join('|');
}

function loadBranchId(): string {
  try {
    return localStorage.getItem(CART_BRANCH_KEY) || '';
  } catch {
    return '';
  }
}

function removeCartItems(): void {
  try {
    localStorage.removeItem(CART_ITEMS_KEY);
  } catch {
    /* private mode */
  }
}

interface StoragePayload {
  cartMeta?: { restaurantId?: string | null; slug?: string | null; restaurantName?: string };
  lines?: Array<{ itemId: string; name: string; price: number; qty: number; options: CartOptionSel[]; note: string }>;
}

function loadState(): Pick<CartState, 'restaurantId' | 'slug' | 'restaurantName' | 'lines'> {
  try {
    const raw = localStorage.getItem(CART_ITEMS_KEY);
    if (!raw) return { restaurantId: null, slug: null, restaurantName: '', lines: [] };
    const parsed: unknown = JSON.parse(raw);
    // الصيغة القديمة كانت مصفوفة أسطر فقط — بلا سياق مطعم
    if (Array.isArray(parsed)) {
      return {
        restaurantId: null,
        slug: null,
        restaurantName: '',
        lines: toCartLines(parsed),
      };
    }
    const obj = parsed as Partial<StoragePayload> | null;
    return {
      restaurantId: obj?.cartMeta?.restaurantId ?? null,
      slug: obj?.cartMeta?.slug ?? null,
      restaurantName: obj?.cartMeta?.restaurantName ?? '',
      lines: toCartLines(obj?.lines ?? []),
    };
  } catch {
    return { restaurantId: null, slug: null, restaurantName: '', lines: [] };
  }
}

function toCartLines(
  raw: Array<{
    id?: string;
    itemId?: string;
    name?: string;
    qty?: number;
    price?: number;
    options?: CartOptionSel[];
    note?: string;
  }>
): CartLine[] {
  return raw
    .map((l) => ({
      itemId: String(l?.itemId ?? l?.id ?? ''),
      name: String(l?.name ?? ''),
      price: Number(l?.price ?? 0),
      qty: Math.max(0, Number(l?.qty ?? 1)),
      options: Array.isArray(l?.options) ? (l?.options as CartOptionSel[]) : [],
      note: typeof l?.note === 'string' ? l?.note : '',
    }))
    .filter((l) => l.itemId);
}

function persist(state: CartState): void {
  try {
    // الصيغة الحالية: كائن بسياق المطعم + الأسطر (بأسطر مطابقة للسلة)
    localStorage.setItem(
      CART_ITEMS_KEY,
      JSON.stringify({
        cartMeta: {
          restaurantId: state.restaurantId,
          slug: state.slug,
          restaurantName: state.restaurantName,
        },
        lines: state.lines.map((l) => ({ ...l, id: l.itemId })),
      })
    );
  } catch {
    /* private mode */
  }
}

function persistBranch(branchId: string): void {
  try {
    localStorage.setItem(CART_BRANCH_KEY, branchId);
  } catch {
    /* private mode */
  }
}

/* ------------------------------------------------------------------ */
/* المتجر                                                               */
/* ------------------------------------------------------------------ */

export interface AddItemInput {
  restaurantId: string;
  slug: string;
  restaurantName: string;
  item: PublicMenuItem;
  displayName: string;
  options: CartOptionSel[];
  note?: string;
  qty?: number;
}

function computeCount(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.qty, 0);
}
function computeSubtotal(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.qty * l.price, 0);
}

interface CartStore extends CartState {
  /** عدد وحدات السلة (للشارة) */
  count: number;
  subtotal: number;
  add: (input: AddItemInput) => void;
  setQty: (itemId: string, sigKey: string, qty: number) => void;
  remove: (itemId: string, sigKey: string) => void;
  setBranch: (branchId: string) => void;
  clear: () => void;
  lineTotal: (line: CartLine) => number;
}

export const useCartStore = create<CartStore>()((set) => {
  const initial = loadState();
  const initialState: CartState = { ...initial, branchId: loadBranchId() };
  return {
    ...initialState,
    count: computeCount(initialState.lines),
    subtotal: computeSubtotal(initialState.lines),

    lineTotal: (line) => line.qty * line.price,

    add: (input) =>
      set((prev) => {
        // حماية مخالطة المطاعم: مطعم مختلف = استبدال كامل للسلة
        const sameRestaurant =
          prev.restaurantId === input.restaurantId &&
          (prev.slug === input.slug || prev.slug === null);
        const linesBase: CartLine[] = sameRestaurant ? prev.lines : [];
        const sig = optionsKey(input.options);
        const existing = linesBase.find(
          (l) => l.itemId === input.item.id && optionsKey(l.options) === sig
        );
        const qty = Math.max(1, input.qty ?? 1);
        const lines: CartLine[] = existing
          ? linesBase.map((l) => (l === existing ? { ...l, qty: Math.min(MAX_QTY_PER_LINE, l.qty + qty) } : l))
          : [
              ...linesBase,
              {
                itemId: input.item.id,
                name: input.displayName,
                price: Number(input.item.price || 0),
                qty,
                options: input.options,
                note: input.note ?? '',
              },
            ];
        persist({
          restaurantId: input.restaurantId,
          slug: input.slug,
          restaurantName: input.restaurantName,
          lines,
          branchId: prev.branchId,
        });
        return {
          restaurantId: input.restaurantId,
          slug: input.slug,
          restaurantName: input.restaurantName,
          lines,
          count: computeCount(lines),
          subtotal: computeSubtotal(lines),
        };
      }),

    setQty: (itemId, sigKey, qty) =>
      set((prev) => {
        const lines =
          qty <= 0
            ? prev.lines.filter((l) => !(l.itemId === itemId && optionsKey(l.options) === sigKey))
            : prev.lines.map((l) =>
                l.itemId === itemId && optionsKey(l.options) === sigKey ? { ...l, qty: Math.min(MAX_QTY_PER_LINE, qty) } : l
              );
        persist({ ...prev, lines });
        return { lines, count: computeCount(lines), subtotal: computeSubtotal(lines) };
      }),

    remove: (itemId, sigKey) =>
      set((prev) => {
        const lines = prev.lines.filter((l) => !(l.itemId === itemId && optionsKey(l.options) === sigKey));
        persist({ ...prev, lines });
        return { lines, count: computeCount(lines), subtotal: computeSubtotal(lines) };
      }),

    setBranch: (branchId) =>
      set(() => {
        persistBranch(branchId);
        return { branchId };
      }),

    clear: () =>
      set(() => {
        removeCartItems();
        return { restaurantId: null, slug: null, restaurantName: '', lines: [], count: 0, subtotal: 0 };
      }),
  };
});

export function getCartState(): CartState {
  const { restaurantId, slug, restaurantName, lines, branchId } = useCartStore.getState();
  return { restaurantId, slug, restaurantName, lines, branchId };
}

export function cartSignature(line: CartLine): string {
  return optionsKey(line.options);
}

/**
 * مجموعات الخيارات الإلزامية للمنتج.
 * قرار معتمد: الإضافات نصّية فقط — الإضافة من البطاقة تعمل مباشرة
 * للمنتجات بلا مجموعات إلزامية؛ التي تحتاج اختيارًا تفتح نافذة التخصيص.
 */
export function requiredOptionGroups(item: PublicMenuItem): PublicMenuItemOptionGroup[] {
  const groups = Array.isArray(item.options?.groups) ? item.options.groups : [];
  return (groups || []).filter((g) => g.required || (g.min ?? 0) > 0);
}
