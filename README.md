# Frota do Atlântico — Frontend

Este repositório contém a versão estática do frontend (um único ficheiro `index.html`) usado pela equipa.

Resumo
- Página estática com abas: Calculadora, Vendas a Empresas, Comprar Peixes, Farm (registo de apanhas) e Administração.
- Opção de persistência via Supabase (Postgres) já integrada no `index.html`. Se não configurar Supabase, a app usa `localStorage` como fallback.

Segurança rápida
- A `anon` key do Supabase pode ficar no cliente se RLS estiver bem configurado; nunca exponhas a `service_role` key.
- Recomendo ativar RLS e políticas (instruções abaixo).

Publicar no GitHub e GitHub Pages
1. Inicializar e enviar para o GitHub

```bash
cd path/to/this/folder
git init
git add index.html README.md .gitignore
git commit -m "Add Frota frontend and deploy workflow"
# criar repositório no GitHub e depois:
git remote add origin https://github.com/SEU_USUARIO/NOME_REPO.git
git branch -M main
git push -u origin main
```

2. Deploy automático com GitHub Pages (workflow incluído)
- O workflow `.github/workflows/deploy-pages.yml` faz upload do conteúdo do repositório e aciona o Pages deployment automático.
- Após o `push` vai ao GitHub → Settings → Pages e confirma que a Source está configurada para "GitHub Actions" (normalmente o workflow cuida disto).
- A URL ficará em `https://SEU_USUARIO.github.io/NOME_REPO/`.

Configurar Supabase (tabelas + RLS)
- No painel Supabase → SQL Editor execute os SQLs abaixo.

SQL (criar tabelas):

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS apanhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quantidade integer NOT NULL,
  datahora timestamptz NOT NULL DEFAULT now(),
  grupo text
);

CREATE TABLE IF NOT EXISTS usuarios (
  user_id uuid PRIMARY KEY,
  nome text,
  cargo text,
  grupo text
);
```

RLS + policies (recomendado com Supabase Auth):

```sql
ALTER TABLE apanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_own ON apanhas
  FOR INSERT
  WITH CHECK (user_id::text = auth.uid());

CREATE POLICY select_filtered ON apanhas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.user_id = auth.uid()::uuid
      AND (
        apanhas.user_id = auth.uid()::uuid
        OR u.cargo IN ('gestor','direcao')
        OR (u.cargo = 'supervisor' AND apanhas.grupo IS NOT DISTINCT FROM u.grupo)
      )
    )
  );

CREATE POLICY delete_own ON apanhas
  FOR DELETE
  USING (user_id::text = auth.uid());
```

Notas finais
- Se precisares que eu integre Supabase Auth no front-end (login/register) e que sincronize automaticamente a tabela `usuarios`, posso implementar essa alteração.
- Depois de fazer `git push`, abre a URL do Pages e testa a app. Se houver erros, abre DevTools → Console e copia o erro aqui; eu ajudo a resolver.

---
Arquivo(s) importantes:
- [index.html](index.html)
- [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)

