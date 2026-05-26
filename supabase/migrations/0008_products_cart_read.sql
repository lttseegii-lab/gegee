-- ============================================================
-- Gegeen Phase 2 — Allow users to read products in their cart / orders
-- ============================================================
-- DIY (custom) products are stored with active=false so they don't appear
-- in the catalog. But users still need to see them in their own cart drawer
-- and on past orders. Existing policy "products_public_read" only allows
-- active=true. Add policies that explicitly grant read access via cart/order
-- ownership.

-- A user can read a product if it's in their cart
drop policy if exists "products_cart_read" on public.products;
create policy "products_cart_read" on public.products
  for select using (
    exists (
      select 1 from public.cart_items
      where cart_items.product_id = products.id
        and cart_items.user_id = auth.uid()
    )
  );

-- A user can read a product if it's in any of their orders
drop policy if exists "products_order_read" on public.products;
create policy "products_order_read" on public.products
  for select using (
    exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.product_id = products.id
        and o.user_id = auth.uid()
    )
  );
