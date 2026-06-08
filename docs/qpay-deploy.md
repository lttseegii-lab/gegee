# QPay төлбөр — Production deploy заавар

QPay V2 төлбөрийн холболтыг production (Vercel + Supabase) дээр идэвхжүүлэх алхамууд.

## 1. Database migrations

`0018_qpay.sql` (qpay_token хүснэгт + `orders.qpay_invoice`) ба `0019_ebarimt.sql`
(`orders.qpay_ebarimt`) migration-уудыг production DB-д хэрэглэнэ:

```bash
cd apps/web
DB_PASSWORD='<prod-db-password>' node scripts/migrate.mjs
```

> Локал дээр аль хэдийн applied. Production DB өөр бол дахин ажиллуулна.

## 2. Vercel environment variables

Vercel → Project → **Settings → Environment Variables** хэсэгт (Production, бас
хүсвэл Preview) дараахыг нэмнэ:

| Key | Value | Тайлбар |
|-----|-------|---------|
| `QPAY_USERNAME` | `NEGE_MN` | QPay merchant нэр |
| `QPAY_PASSWORD` | `maVeJRVC` | QPay merchant нууц үг |
| `QPAY_INVOICE_CODE` | `NEGE_MN_INVOICE` | Invoice code |
| `NEXT_PUBLIC_SITE_URL` | `https://gegeen.mn` | **Заавал** public домэйн — callback энд ирнэ |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ…` | Аль хэдийн тохируулсан байж болно |

Сонголтот:
- `QPAY_BASE_URL` — default `https://merchant.qpay.mn/v2` (sandbox бол өөрчилнө).
- `QPAY_EBARIMT_ENABLED` — `false` болговол и-баримт үүсгэхгүй (default: on).

> ⚠️ Эдгээрийг **Vercel-д л** хадгална. `.env.local`-г хэзээ ч commit хийхгүй
> (`.gitignore`-д орсон).

## 3. Callback URL — public хаяг заавал

QPay төлбөр төлөгдөхөд `GET {NEXT_PUBLIC_SITE_URL}/api/qpay-webhook?orderId=…`
руу дуудаж, `qpay_payment_id`-г залгана. Тиймээс:

- `NEXT_PUBLIC_SITE_URL` нь **гадаад сүлжээнээс хүрдэг** домэйн байх ёстой
  (`localhost` болохгүй).
- Callback-ийн хариу **заавал** `HTTP 200` + body `SUCCESS` (код хийдэг).
- QPay merchant admin дээр callback хаягийг тусад нь бүртгэх шаардлагагүй —
  invoice бүрд `callback_url` дамждаг.

## 4. Deploy

```bash
git checkout main
git merge feat/qpay-payment
git push origin main      # Vercel auto-deploy (main → production)
```

> Env хувьсагчид тохируулагдсаны **дараа** deploy хий. Үгүй бол payment page
> "QPAY_USERNAME/PASSWORD тохируулагдаагүй" гэж харуулна.

## 5. Production smoke test

1. Жинхэнэ захиалга үүсгэ (эсвэл бага үнэтэй тест бараагаар).
2. Payment page дээр QR гарч ирэхийг шалга.
3. Банкны аппаар QR уншуулж төл.
4. QPay callback ирж захиалга **paid** болж, success руу шилжихийг шалга.
5. Vercel logs дээр `QPay callback` болон Ebarimt лог байгааг хар.

### Ebarimt (и-баримт) идэвхжүүлэх

И-баримт 3.0 үүсгэхийн тулд **QPay-тэй холбоо барьж merchant дээр e-receipt
тохиргоог идэвхжүүлэх** шаардлагатай. Идэвхжсэний дараа төлбөр бүрийн дараа
и-баримт автоматаар үүсч (`orders.qpay_ebarimt`), admin захиалгын дэлгэрэнгүйд
сугалааны дугаар харагдана. Идэвхжээгүй бол төлбөр хэвийн ажиллана, зүгээр л
и-баримт алгасагдана (log-д warning).

## Архитектур (товч)

```
checkout → order (pending_payment)
   → /checkout/payment → createInvoice() → QR
   → хэрэглэгч QR уншуулж төлнө
   → QPay GET /api/qpay-webhook?orderId=…&qpay_payment_id=…
        → payment/check → order = paid → "SUCCESS"
        → (best-effort) ebarimt_v3/create
   → PaymentPoller (DB статус 3s, verify 15s) → success руу шилжинэ
```

- Token: `expires_in` нь **timestamp** (epoch). `qpay_token` хүснэгтэд cache,
  дуустал нь дахин авахгүй.
- `payment/check`-ийг байнга дуудахгүй (QPay хориглодог) — callback + ховор
  fallback.
