create table drivers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    license_number text not null,
    phone text,
    email text,
    user_id uuid references auth.users(id),
    company_id uuid references companies(id),
    active boolean not null default true,
    created_at timestamptz not null default now()
);

alter table drivers enable row level security;

create policy "Authenticated users can view drivers"
on drivers for select
to authenticated
using (true);

create policy "Users can insert their own drivers"
on drivers for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own drivers"
on drivers for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own drivers"
on drivers for delete
to authenticated
using (auth.uid() = user_id);