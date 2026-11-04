/**
 * صفحة تتبع الطلب — /orders/:id?token=...
 * ------------------------------------------------------------
 * الضيف يتتبع طلبه برمز التتبع الآمن (orderToken) الذي أعاده
 * إنشاء الطلب. البيانات من GET /api/public/orders/:id/track?token=…
 * (نفس نقطة النهاية القائمة — لا تغيير في الخادم).
 */
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { publicOrderAPI } from '../../shared/lib/api.service';
import type { TrackOrderResponse, RemoteOrderStatus } from '../../shared/types/public';
import { useI18n, resolveLang } from '../../shared/i18n';

const STEPS: Array<{ state: RemoteOrderStatus; key: string }> = [
  { state: 'pending', key: 'publicUi.statusPending' },
  { state: 'confirmed', key: 'publicUi.statusConfirmed' },
  { state: 'preparing', key: 'publicUi.statusPreparing' },
  { state: 'ready', key: 'publicUi.statusReady' },
  { state: 'completed', key: 'publicUi.statusCompleted' },
];

const STEP_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  completed: 4,
};

export default function OrderTrackingPage() {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { t, lang, dir } = useI18n();
  const [data, setData] = useState<TrackOrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !token) return;
    setData(null);
    setError(null);
    publicOrderAPI.track(orderId, token).then((res) => {
      setData(res.data ?? null);
    }).catch((e: { message?: string }) => setError(e?.message || 'not found'));
  }, [orderId, token]);

  document.documentElement.dir = dir;

  if (error) {
    return (
      <div className="min-h-dvh grid place-items-center bg-offwhite px-6" dir={dir}>
        <div className="max-w-sm text-center">
          <p className="font-display text-2xl font-semibold text-ink-ink">404</p>
          <p className="mt-2 text-sm text-ink-soft">{t('publicUi.notFoundSub')}</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-dvh grid place-items-center bg-offwhite px-6" dir={dir}>
        <p className="max-w-sm text-center text-sm text-ink-soft">{t('publicUi.needToken')}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-dvh grid place-items-center bg-offwhite" dir={dir}>
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  const status = (data.status || 'pending') as RemoteOrderStatus;
  const cancelled = status === 'cancelled';
  const stepIndex = STEP_INDEX[status] ?? 0;

  return (
    <div className="min-h-dvh bg-offwhite px-4 py-10" dir={dir}>
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-2xl font-semibold text-ink-ink">{t('publicUi.trackingTitle')}</h1>
        <p className="mt-1 text-sm text-ink-soft">#{data.number}</p>

        {cancelled ? (
          <div className="mt-6 rounded-2xl border border-rose/40 bg-rose/10 p-5 text-center">
            <p className="font-semibold text-rose-dark">{t('publicUi.statusCancelled')}</p>
          </div>
        ) : (
          <ol className="mt-6 space-y-0">
            {STEPS.map((step, i) => {
              const done = i <= stepIndex;
              const last = i === STEPS.length - 1;
              return (
                <li key={step.state} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${done ? 'bg-success text-white' : 'bg-sand text-clay'}`}>
                      {done ? '✓' : i + 1}
                    </span>
                    {!last && <span className={`h-full w-0.5 flex-1 ${i < stepIndex ? 'bg-success' : 'bg-sand'}`} />}
                  </div>
                  <div className="pb-5">
                    <p className={`text-[13.5px] font-semibold ${done ? 'text-ink-ink' : 'text-ink-soft'}`}>
                      {t(step.key)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-4 rounded-2xl border border-sand bg-white p-5 text-[13.5px]">
          <div className="flex justify-between">
            <span className="text-ink-soft">{t('publicUi.totalLabel')}</span>
            <span className="font-bold">{data.total}</span>
          </div>
          {data.restaurant ? (
            <div className="mt-2 flex justify-between">
              <span className="text-ink-soft">{resolveLang(data.restaurant.name, lang)}</span>
              {data.restaurant.phone ? (
                <a className="font-medium text-primary-dark" href={`tel:${data.restaurant.phone}`}>{data.restaurant.phone}</a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
