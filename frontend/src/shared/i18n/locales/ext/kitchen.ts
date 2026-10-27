/**
 * i18n extension owned by the **worker board / payments / subscription** agent.
 * Merged into the main dictionaries by `src/shared/i18n/index.tsx` — do not import elsewhere.
 *
 * Rules: keep `ar` and `ku` typed as `Deep<typeof en>` so every key exists in all
 * three languages, and only add keys under your own top-level group `kitchenMore`.
 */
type Deep<T> = { [K in keyof T]: T[K] extends string ? string : Deep<T[K]> }

const en = {
  kitchenMore: {
    /* ------------------------------ kitchen board --------------------------- */
    oneOrder: '1 order',

    /* ----------------------------- subscription ---------------------------- */
    statusTrialing: 'In trial',
    statusPastDue: 'Payment overdue',
    freeForever: 'Free forever',
    trialPrice: 'Free for 14 days',
    planSwitched: 'Plan switched',
    renewed: 'Subscription renewed',
    renewHint: 'Renewing extends this demo period instantly — no payment is taken.',
    pausedNote: 'Your public menu is paused and publishing is disabled until you renew.',

    /* ------------------------------- payments ------------------------------ */
    yourMethods: 'Connected methods',
    availableProviders: 'Platform providers',
    providersSub: 'What this demo platform lets you connect today.',
    providerDisabledNote:
      'The platform has not enabled this provider yet — it cannot be connected in this demo.',
    noProviderYet: 'No provider can be connected right now.',
    methodLabel: 'Label shown to guests',
    methodLabelPh: 'e.g. Cash at the table',
    accountPh: 'e.g. Terminal 1 or IBAN ending 4242',
    removeMethodTitle: 'Remove this payment method?',
    removeMethodHint: 'It disappears from the demo menu at once — nothing real is cancelled.',
    methodAdded: 'Payment method added',
    methodRemoved: 'Payment method removed',
  },
}

const ar: Deep<typeof en> = {
  kitchenMore: {
    oneOrder: 'أوردر واحد',
    statusTrialing: 'تجربة جارية',
    statusPastDue: 'الدفع متأخر',
    freeForever: 'مجاني للأبد',
    trialPrice: 'مجاني لمدة 14 يوماً',
    planSwitched: 'تم تغيير الباقة',
    renewed: 'تم تجديد الاشتراك',
    renewHint: 'التجديد يمدّد هذه الفترة التجريبيّة فوراً — دون خصم أي مبلغ.',
    pausedNote: 'منيو العام متوقّف والنشر معطّل حتى تجديد الاشتراك.',

    yourMethods: 'وسائل الدفع المربوطة',
    availableProviders: 'مزوّدو المنصة',
    providersSub: 'ما يتيحه منصّة هذا العرض التجريبي ربطه اليوم.',
    providerDisabledNote: 'لم تُفعّل المنصّة هذه الوسيلة بعد — لا يمكن ربطها في هذا العرض.',
    noProviderYet: 'لا توجد وسيلة يمكن ربطها الآن.',
    methodLabel: 'الاسم الظاهر للضيوف',
    methodLabelPh: 'مثال: نقداً على الطاولة',
    accountPh: 'مثال: الجهاز 1 أو IBAN ينتهي بـ 4242',
    removeMethodTitle: 'إزالة وسيلة الدفع هذه؟',
    removeMethodHint: 'ستختفي من المنيو التجريبي فوراً — لن يُلغى أي شيء حقيقي.',
    methodAdded: 'تمت إضافة وسيلة الدفع',
    methodRemoved: 'تمت إزالة وسيلة الدفع',
  },
}

const ku: Deep<typeof en> = {
  kitchenMore: {
    oneOrder: 'داواکارییەک',
    statusTrialing: 'تاقیکردنەوە چالاکە',
    statusPastDue: 'پارەدان هەنەکەوتووە',
    freeForever: 'بەخۆڕایی بۆ هەمیشە',
    trialPrice: 'بەخۆڕایی بۆ 14 ڕۆژ',
    planSwitched: 'پلان بگۆڕدرا',
    renewed: 'ئوبتێرشن تازەکرایەوە',
    renewHint: 'تازەکردنەوە ئەم دەمەی دیمۆ بە فوری درێژ دەکات — هیچ پارەیەک نادەدرێت.',
    pausedNote: 'مینیۆی گشتی وەستاوە و بڵاوکردنەوە ناچالاکە تا تازەکردنەوە.',

    yourMethods: 'ڕێگاکانی پارەدانی پەیوەندیکراو',
    availableProviders: 'دابینکەرانی پلاتفۆرم',
    providersSub: 'ئەوەی ئەم پلاتفۆرمی دیمۆ ئێستا ڕێگەت پێدەدات ببینرێت.',
    providerDisabledNote: 'پلاتفۆرم هێشتا ئەم دابینکەرە چالاک نەکردووە — لەم دیمۆدا ناتوانرێت ببینرێت.',
    noProviderYet: 'هیچ دابینکەرێک نییە کە ئێستا بتوانرێت ببینرێت.',
    methodLabel: 'ناونیشانی کە بۆ میوانان پیشان دەدرێت',
    methodLabelPh: 'وەک: نەقد لە مێزەکە',
    accountPh: 'وەک: تێرمیناڵی 1 یان IBAN کە بە 4242 کۆتایی دەبێت',
    removeMethodTitle: 'ئەم ڕێگای پارەدانە بسڕدرێتەوە؟',
    removeMethodHint: 'بە فوری لە مینیۆی دیمۆدا دەبەرێت — هیچ شتێکی ڕاستی نادەدرێتەوە.',
    methodAdded: 'ڕێگای پارەدان زیادکرا',
    methodRemoved: 'ڕێگای پارەدان سڕدرایەوە',
  },
}

export const kitchen = { en, ar, ku }
