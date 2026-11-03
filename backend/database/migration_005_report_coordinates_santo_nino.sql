-- GPS coordinates on reports ("Use my location"), and the missing Santo Niño barangay.
-- Applied to Supabase as migration "reports_coordinates_and_santo_nino".

-- Where the reporter stood when they used "Use my location" (WGS84). Optional: typed-address
-- reports and every report made before this change have none.
alter table public.reports
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.reports
  add constraint reports_coordinates_pair check ((latitude is null) = (longitude is null)),
  add constraint reports_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint reports_longitude_range check (longitude is null or longitude between -180 and 180);

comment on column public.reports.latitude is 'GPS latitude from the reporter''s device ("Use my location"); null when the address was typed.';
comment on column public.reports.longitude is 'GPS longitude from the reporter''s device ("Use my location"); null when the address was typed.';

-- Santo Niño, an official Cebu City barangay, was missing from the seed list.
insert into public.barangays (id, municipality_id, name)
values ('cebu-city-santo-nino', 'cebu-city', 'Santo Niño')
on conflict (id) do nothing;
