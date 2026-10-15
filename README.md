# Caixa da viagem — Vite + React + Supabase

Aplicação responsiva para registrar entradas (contribuições para o caixa) e gastos da equipe. Inclui histórico recente, descrição opcional, exclusão de lançamento e resumo dos totais.

## 1. Requisitos

- Node.js LTS instalado: https://nodejs.org/
- Conta no Supabase: https://supabase.com/
- Conta no GitHub: https://github.com/

## 2. Criar o projeto Supabase

1. Crie um projeto no Supabase.
2. Abra **SQL Editor** e escolha **New query**.
3. Abra `supabase/schema.sql` deste projeto, copie o conteúdo e execute no SQL Editor.
4. No painel do projeto, abra **Project Settings > API** (a interface pode variar).
5. Copie a **Project URL** e a chave pública/anon (não use `service_role` no frontend).

### Importante sobre segurança

Esta versão não tem login. Para funcionar sem autenticação, o SQL cria políticas públicas de leitura, inclusão e exclusão. Isso significa que qualquer pessoa que obtenha a URL do site e a chave pública pode potencialmente consultar, inserir ou apagar dados. A chave `anon` é pública por definição; RLS não transforma uma política aberta em acesso privado.

Se os dados precisam ficar realmente restritos a você, não publique esta versão aberta. A opção recomendada é adicionar uma senha/autenticação (Supabase Auth) ou passar as operações por um backend/Edge Function com segredo guardado no servidor e políticas fechadas. Um endereço difícil de adivinhar não é controle de acesso seguro.

## 3. Configurar localmente

Abra um terminal na pasta do projeto e execute:

```bash
npm install
```

Crie um arquivo `.env.local` na raiz (na mesma pasta do `package.json`) com:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

Substitua pelos valores copiados do Supabase. Não coloque aspas e nunca use a chave `service_role` em arquivo `VITE_*`.

## 4. Colocar os nomes da equipe

Edite `src/config.ts` e substitua os nomes de exemplo:

```ts
export const PESSOAS = [
  "Nome 1",
  "Nome 2",
  "Nome 3",
];
```

Salve o arquivo. O dropdown será atualizado automaticamente. A pessoa selecionada fica associada a cada lançamento.

## 5. Executar e testar

```bash
npm run dev
```

Abra o endereço local mostrado no terminal (normalmente `http://localhost:5173`).

Teste:
1. Escolha uma pessoa.
2. Selecione **Gasto** ou **Entrada**.
3. Informe o valor em reais; pode usar `12,50` ou `12.50`.
4. Opcionalmente, escreva uma descrição.
5. Clique em **Registrar lançamento**.
6. Confira o histórico e os totais. Atualize a página para verificar que os dados continuam no banco.

Antes de publicar, confira também se o projeto compila:

```bash
npm run build
```

## 6. Subir para o GitHub

1. Crie um repositório no GitHub, por exemplo `controle-gastos-viagem`.
2. Não envie o `.env.local` (ele já está ignorado pelo `.gitignore`).
3. No terminal, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "Cria controle de gastos da viagem"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/controle-gastos-viagem.git
git push -u origin main
```

Troque a URL pelo endereço real do seu repositório. Se o Git pedir autenticação, siga a orientação do GitHub.

## 7. Publicar com Vercel

1. Entre em https://vercel.com/ e importe o repositório do GitHub.
2. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
3. Em **Settings > Environment Variables**, cadastre:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Faça redeploy depois de adicionar as variáveis.
5. Cada push na branch configurada (normalmente `main`) deve disparar um novo deploy.

## 8. Como os totais são calculados

- Total de entradas: soma dos lançamentos com tipo `entrada`.
- Total de gastos: soma dos lançamentos com tipo `gasto`.
- Saldo do caixa: entradas menos gastos.

O histórico mostra os 200 lançamentos mais recentes, mas os totais são calculados sobre os lançamentos carregados. Para viagens com mais de 200 registros, vale alterar para consultar os totais diretamente no banco ou implementar paginação.

## 9. Arquivos principais

- `src/App.tsx`: tela, formulário, histórico e totais.
- `src/styles.css`: estilo responsivo para celular, tablet e desktop.
- `src/config.ts`: nomes da equipe.
- `src/lib/supabase.ts`: conexão Supabase.
- `supabase/schema.sql`: tabela e políticas de acesso.
