-- ============================================================
-- Gegeen — Auth triggers
-- On auth.users INSERT → auto-create profiles row
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, provider, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_app_meta_data->>'provider',
      'email'
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RPC: merge_guest_cart
-- Called after login to merge anonymous (localStorage) cart with server cart.
-- Greater qty wins per product (user intent: keep max selection).
-- ============================================================
create or replace function public.merge_guest_cart(items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  item jsonb;
begin
  if uid is null then
    raise exception 'auth required';
  end if;

  for item in select * from jsonb_array_elements(items)
  loop
    insert into public.cart_items (user_id, product_id, qty)
    values (
      uid,
      item->>'id',
      least(20, greatest(1, (item->>'qty')::int))
    )
    on conflict (user_id, product_id)
    do update set qty = least(20, greatest(cart_items.qty, excluded.qty));
  end loop;
end;
$$;

grant execute on function public.merge_guest_cart(jsonb) to authenticated;

-- ============================================================
-- RPC: set_default_address
-- Atomically clear other defaults and mark the given address as default.
-- ============================================================
create or replace function public.set_default_address(addr_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'auth required';
  end if;

  -- Verify the address belongs to the user
  if not exists (
    select 1 from public.addresses
    where id = addr_id and user_id = uid
  ) then
    raise exception 'address not found or not owned';
  end if;

  update public.addresses
    set is_default = false
    where user_id = uid and id <> addr_id;

  update public.addresses
    set is_default = true
    where id = addr_id;
end;
$$;

grant execute on function public.set_default_address(bigint) to authenticated;
