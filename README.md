# FIAT — Plataforma Católica Digital

Aplicação React/Vite com autenticação de membros, PostgreSQL e painel administrativo no Supabase, protegidos por Row Level Security (RLS).

## Arquitetura de mídia

Áudios e vídeos **não são incluídos no build do site**. O painel salva apenas URLs:

- Vídeos: YouTube não listado (mais simples), Vimeo ou Cloudflare Stream.
- Áudios: Supabase Storage, Cloudinary ou Cloudflare R2.
- Capas: Supabase Storage, Cloudinary ou outro CDN.

Isso mantém o deploy pequeno e transfere o streaming para um serviço próprio para mídia.

## Configuração do Supabase

1. Crie um projeto em <https://supabase.com/dashboard>.
2. Abra **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e execute.
3. Em **Authentication > Providers**, mantenha **Email** habilitado.
4. Em **Project Settings > API**, copie a Project URL e a chave pública `anon`.
5. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## Primeiro administrador

1. Cadastre normalmente a conta que será administradora pelo aplicativo.
2. No SQL Editor, execute `update public.profiles set role = 'admin' where email = 'seu@email.com';`.
3. Troque pelo e-mail real da conta.
4. Saia e entre novamente no aplicativo.

Depois disso, o próprio administrador pode promover ou rebaixar outras contas no painel.

## Desenvolvimento

```bash
npm install
npm run dev
```

Validação:

```bash
npm run lint
npm run build
```

## Publicação

Na Vercel, configure as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, comando `npm run build` e saída `dist`.

## Segurança

- Não envie `.env.local` ao Git.
- A chave `anon` é pública por definição; a proteção real está nas regras RLS de `supabase/schema.sql`.
- Nunca coloque a chave `service_role` no frontend.
