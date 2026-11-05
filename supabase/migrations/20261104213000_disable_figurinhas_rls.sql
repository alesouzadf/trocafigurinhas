alter table public.figurinha disable row level security;
alter table public.figurinhas disable row level security;

create index if not exists figurinhas_usuario_id_idx on public.figurinhas(usuario_id);
