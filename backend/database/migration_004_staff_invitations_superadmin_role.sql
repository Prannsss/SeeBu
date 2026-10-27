-- Superadmins can invite admins (for any municipality) and other superadmins through staff invitations.
-- Applied to Supabase as migration "staff_invitations_add_superadmin_role".
alter table public.staff_invitations drop constraint staff_invitations_role_check;
alter table public.staff_invitations add constraint staff_invitations_role_check
  check (role in ('superadmin', 'admin', 'workforce-admin', 'workforce'));
