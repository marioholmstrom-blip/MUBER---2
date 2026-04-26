# SQL 025 — Cierre de requests abiertas (TEST)

Archivo fuente fuera del repo Git principal:
- `SQL/test/025_close_driver_open_requests_test.sql`

Copia preservada para trazabilidad:

```sql
begin;

create temp table tmp_muber_driver_requests_to_close as
select id
from public.requests
where status in ('pending', 'new', 'accepted');

select count(*) as target_requests
from tmp_muber_driver_requests_to_close;

create temp table tmp_requests_closed as
with updated as (
  update public.requests
  set status = 'completed'
  where id in (select id from tmp_muber_driver_requests_to_close)
  returning id, service_type, status, origin_text, destination_text, requested_at
)
select * from updated;

create temp table tmp_tracking_deactivated_completed_trips as
with updated as (
  update public.driver_live_locations dll
  set
    is_active = false,
    updated_at = now()
  where dll.is_active = true
    and exists (
      select 1
      from public.trips t
      where t.id = dll.trip_id
        and t.trip_status = 'completed'
    )
  returning dll.trip_id, dll.request_id, dll.driver_id, dll.is_active, dll.updated_at
)
select * from updated;

create temp table tmp_related_trips as
select t.id as trip_id, t.request_id
from public.trips t
where t.request_id in (select id from tmp_muber_driver_requests_to_close);

create temp table tmp_trips_closed as
with updated as (
  update public.trips t
  set
    trip_status = 'completed',
    completed_at = coalesce(t.completed_at, now())
  where t.request_id in (select id from tmp_muber_driver_requests_to_close)
    and t.trip_status is distinct from 'completed'
  returning t.id, t.request_id, t.trip_status, t.completed_at
)
select * from updated;

create temp table tmp_payments_marked_paid as
with updated as (
  update public.payments p
  set
    payment_status = 'paid',
    paid_at = coalesce(p.paid_at, now())
  where p.trip_id in (select trip_id from tmp_related_trips)
    and p.payment_status is distinct from 'paid'
  returning p.id, p.trip_id, p.amount_clp, p.payment_status, p.paid_at
)
select * from updated;

create temp table tmp_tracking_deactivated as
with updated as (
  update public.driver_live_locations dll
  set
    is_active = false,
    updated_at = now()
  where dll.is_active = true
    and (
      dll.request_id in (select id from tmp_muber_driver_requests_to_close)
      or dll.trip_id in (select trip_id from tmp_related_trips)
    )
  returning dll.trip_id, dll.request_id, dll.driver_id, dll.is_active, dll.updated_at
)
select * from updated;

select
  (select count(*) from tmp_muber_driver_requests_to_close) as requests_targeted,
  (select count(*) from tmp_requests_closed) as requests_closed,
  (select count(*) from tmp_related_trips) as trips_related,
  (select count(*) from tmp_trips_closed) as trips_closed,
  (select count(*) from tmp_payments_marked_paid) as payments_marked_paid,
  (
    select count(*)
    from tmp_related_trips rt
    left join public.payments p on p.trip_id = rt.trip_id
    where p.id is null
  ) as payments_missing_not_created,
  (
    (select count(*) from tmp_tracking_deactivated)
    + (select count(*) from tmp_tracking_deactivated_completed_trips)
  ) as tracking_deactivated;

select *
from tmp_requests_closed
order by requested_at desc;

select *
from tmp_trips_closed;

select *
from tmp_payments_marked_paid;

select *
from tmp_tracking_deactivated;

select *
from tmp_tracking_deactivated_completed_trips;

commit;
```
