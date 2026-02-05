# Frota do Atlântico

Aplicação com abas: Calculadora, Vendas a Empresas, Comprar Peixes, Farm (registo de apanhas) e Administração. Os dados são guardados em **ficheiros JSON** e servidos por um backend Node no mesmo domínio (sem CORS).

## Executar em local

1. Instalar dependências e arrancar o servidor:

```bash
npm install
npm start
```

2. O servidor usa a variável de ambiente **`PORT`** (por defeito `3000`). Exemplo:

```bash
PORT=3000 npm start
```

3. Abrir no browser: `http://localhost:3000`

## Estrutura de dados

A pasta **`data/`** contém os ficheiros JSON:

- `usuarios.json` — utilizadores (seed: admin / 1234)
- `registos.json` — vendas e compras
- `caixa.json` — `{ "valorTotal": 0 }`
- `movimentos.json` — movimentos de caixa
- `apanhas.json` — apanhas de peixe por utilizador

A API expõe **GET** e **POST** para cada entidade em `/api/usuarios`, `/api/registos`, `/api/caixa`, `/api/movimentos`, `/api/apanhas`.

## Deploy

- Fazer deploy do projeto completo (incl. `server.js`, `index.html`, `data/`) numa plataforma Node (Render, Railway, Fly.io, etc.).
- Definir o comando de arranque: **`node server.js`** ou **`npm start`**.
- Configurar **`PORT`** se a plataforma o exigir (muitas usam `process.env.PORT` automaticamente).

Nota: em muitos hosts cloud o filesystem é efémero. Para persistência, usar volume persistente na pasta `data/` ou alterar o backend para usar armazenamento externo (ex.: S3/R2).

## Ficheiros principais

- [index.html](index.html) — frontend (uma página)
- [server.js](server.js) — servidor Express (estáticos + API JSON)
- [data/](data/) — ficheiros JSON de dados
