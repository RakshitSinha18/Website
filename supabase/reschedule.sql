-- ============================================================================
--  RESCHEDULE + hardened student update policy on class_bookings
--  Run in Supabase → SQL Editor. Idempotent.
--
--  Lets a student reschedule (change scheduled_at / notes) their OWN booking,
--  but NOT flip status/payment_status (only the payment webhook / mentor can).
--  This closes a gap where the previous student-update policy allowed changing
--  any column, including confirming a booking without paying.
-- ============================================================================

-- Remove the older, too-permissive student update policies.
drop policy if exists "student updates own bookings" on public.class_bookings;
drop policy if exists "students update own class bookings" on public.class_bookings;

-- Students may update their own booking, but status & payment_status must stay
-- exactly what they already are (checked against the current row via a trigger,
-- since RLS WITH CHECK can't see OLD values). We enforce that with a trigger.
create policy "student reschedules own booking"
  on public.class_bookings for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger: block students from changing protected columns. The mentor (is_mentor)
-- and the service role (used by the payment webhook) bypass this check.
create or replace function public.guard_booking_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Service role / mentor may change anything.
  if public.is_mentor() or auth.role() = 'service_role' then
    return new;
  end if;
  -- Students must not alter status or payment_status.
  if new.status is distinct from old.status
     or new.payment_status is distinct from old.payment_status then
    raise exception 'Not allowed to change booking status.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_booking_update_trg on public.class_bookings;
create trigger guard_booking_update_trg
  before update on public.class_bookings
  for each row execute function public.guard_booking_update();
