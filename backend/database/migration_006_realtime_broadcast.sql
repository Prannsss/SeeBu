-- Live updates via Realtime Broadcast instead of postgres_changes.
-- Applied to Supabase as migrations "realtime_broadcast_changes" (triggers, publication) and
-- "realtime_broadcast_task_department" (the function below, final version).
--
-- Why: these tables have row-level security with no policies, so the browser's public (anon) key
-- can read no rows, and Realtime only delivers postgres_changes for rows the subscriber can read.
-- Live updates therefore never reached any browser. Opening read access to anon would expose every
-- report (contact details, coordinates) to anyone holding the public key, so instead a trigger
-- broadcasts a minimal "something changed" signal on a public topic, and the app refetches through
-- its authenticated API. Payloads carry no report ids (they double as public tracking codes), no
-- names, contact details, descriptions or coordinates.

create or replace function public.broadcast_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb := to_jsonb(coalesce(new, old));
  payload jsonb := jsonb_build_object('table', tg_table_name, 'op', tg_op);
  task_department integer;
begin
  if tg_table_name = 'reports' then
    payload := payload || jsonb_build_object(
      'status', row_data->'status',
      'municipality_id', row_data->'municipality_id',
      'department_id', row_data->'delegated_to');
  elsif tg_table_name = 'tasks' then
    -- tasks.delegated_to holds an officer id; the department comes from the linked report.
    select r.delegated_to into task_department from public.reports r where r.id = row_data->>'related_report_id';
    payload := payload || jsonb_build_object(
      'task_id', row_data->'id', -- not "id": realtime.send uses that key for its message id
      'status', row_data->'status',
      'assigned_to', row_data->'assigned_to',
      'department_id', task_department);
  end if;

  -- A broadcast must never block the write itself.
  begin
    perform realtime.send(payload, 'change', 'seebu:changes', false);
  exception when others then
    raise warning 'broadcast_change on %: %', tg_table_name, sqlerrm;
  end;
  return null;
exception when others then
  raise warning 'broadcast_change on %: %', tg_table_name, sqlerrm;
  return null;
end;
$$;

revoke all on function public.broadcast_change() from public, anon, authenticated;

create trigger broadcast_change after insert or update or delete on public.reports
  for each row execute function public.broadcast_change();
create trigger broadcast_change after insert or update or delete on public.tasks
  for each row execute function public.broadcast_change();
create trigger broadcast_change after insert or update or delete on public.report_photos
  for each row execute function public.broadcast_change();
create trigger broadcast_change after insert or update or delete on public.report_timeline
  for each row execute function public.broadcast_change();
create trigger broadcast_change after insert or update or delete on public.task_proof_photos
  for each row execute function public.broadcast_change();
create trigger broadcast_change after insert or update or delete on public.task_timeline
  for each row execute function public.broadcast_change();

-- postgres_changes could never be delivered for these tables (see above); stop decoding them.
alter publication supabase_realtime drop table
  public.reports, public.tasks, public.report_photos, public.report_timeline,
  public.task_proof_photos, public.task_timeline;
