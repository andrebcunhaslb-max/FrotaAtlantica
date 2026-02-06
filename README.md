# Frota do Atlântico

Aplicação React (Vite + Tailwind) com abas: Calculadora, Vendas a Empresas, Comprar Peixes, Farm (registo de apanhas) e Administração. Os dados são guardados em **ficheiros JSON** e servidos por API no mesmo domínio (sem CORS).

## Executar em local

1. Instalar dependências, construir o frontend e arrancar o servidor:

```bash
npm install
npm run build
npm start
```

2. Para desenvolvimento do frontend com proxy para a API:

```bash
npm run dev
```

(O Vite serve a app em `http://localhost:5173` e faz proxy de `/api` para o backend. Para isso, arrancar também o backend noutro terminal: `npm start`.)

3. O servidor usa a variável de ambiente **`PORT`** (por defeito `3000`). Exemplo:

```bash
PORT=3000 npm start
```

4. Abrir no browser: `http://localhost:3000` (após `npm run build` + `npm start`) ou `http://localhost:5173` (apenas `npm run dev`).

## Estrutura de dados

A pasta **`data/`** contém os ficheiros JSON (em local). Na **primeira execução** não é necessário criar ficheiros: a API devolve um utilizador inicial até existir `usuarios.json`:

- **Login inicial:** utilizador `admin`, PIN `1234` (cargo: Direção). Depois pode adicionar mais utilizadores na aba Administração e os dados passam a ser guardados em `usuarios.json`.
- `registos.json` — vendas e compras
- `caixa.json` — `{ "valorTotal": 0 }`
- `movimentos.json` — movimentos de caixa
- `apanhas.json` — apanhas de peixe por utilizador

A API expõe **GET** e **POST** para cada entidade em `/api/usuarios`, `/api/registos`, `/api/caixa`, `/api/movimentos`, `/api/apanhas`, e **GET** em `/api/fivem-players`.

## Deploy na Vercel (recomendado)

O projeto segue as [boas práticas Vercel para React](https://vercel.com/docs):

1. **Build**: comando `npm run build`; output em `dist/`.
2. **API**: funções serverless em `/api` (um ficheiro por endpoint). Na Vercel os dados são escritos em `/tmp` (efémero); para persistência em produção use [Vercel Blob](https://vercel.com/docs/storage/vercel-blob), [Vercel KV](https://vercel.com/docs/storage/vercel-kv) ou uma base de dados externa.
3. **SPA**: rewrites em `vercel.json` encaminham todas as rotas não-API para `index.html`.
4. **Cache**: cabeçalhos em `vercel.json` para assets em `/assets/` (longa duração).

Para fazer deploy:

```bash
npm i -g vercel
vercel
```

Ou ligue o repositório Git ao projeto na [Vercel](https://vercel.com); o build e o deploy são automáticos.

**Variáveis de ambiente (opcional):** na Vercel pode definir variáveis no dashboard. O frontend usa apenas `/api` em caminho relativo; não é obrigatório definir `VITE_*` para a API.

## Docker (self-hosted)

Build e execução com o conteúdo da imagem (produção):

```bash
docker compose up --build
```

Os dados JSON ficam no volume nomeado **`frota-data`** e persistem entre reinícios do contentor. A app fica disponível em `http://localhost:2050`.

Sem compose: `docker build -t frota .` e depois `docker run -p 2050:2050 -v frota-data:/app/data frota`. O porto é configurável via variável de ambiente **`PORT`** (por defeito no Dockerfile: 2050).

## Deploy noutras plataformas

- Fazer deploy do projeto completo (incl. `server.js`, `dist/` ou build no CI, `data/`) numa plataforma Node (Render, Railway, Fly.io, etc.).
- Definir o comando de arranque: **`node server.js`** ou **`npm start`**.
- Configurar **`PORT`** se a plataforma o exigir.

Nota: em muitos hosts cloud o filesystem é efémero. Para persistência, usar volume persistente na pasta `data/` ou armazenamento externo.

## Ficheiros principais

- [index.html](index.html) — entrada Vite
- [src/](src/) — app React (componentes, contexto, estilos)
- [api/](api/) — funções serverless Vercel (uma por endpoint)
- [server.js](server.js) — servidor Express para desenvolvimento/local (estáticos + API JSON)
- [data/](data/) — ficheiros JSON de dados (local)
- [vercel.json](vercel.json) — configuração de build, rewrites e headers na Vercel
