# TrocaFigurinhas

Projeto monorepo com frontend em Next.js e backend em NestJS para gerenciamento de figurinhas.

## Estrutura

- `frontend/` - aplicação web em Next.js
- `backend/` - API em NestJS
- `supabase/schema.sql` - script SQL para criar as tabelas no Supabase

## Requisitos

- Node.js 18+
- npm
- Projeto criado no Supabase com as tabelas `usuario` e `figurinhas`

## Configuração

1. Copie os arquivos `.env.example` para `.env` e configure os valores.
2. Execute `npm install` na raiz do projeto.
3. Rode o projeto com `npm run dev`.

## Acesso

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Tabelas no Supabase

O SQL para criação das tabelas está em `supabase/schema.sql`.
