# Colab Desafio - Zeladoria Inteligente com IA

PoC fullstack para triagem automática de solicitações urbanas.
O sistema recebe relatos de cidadãos, classifica com IA, persiste no banco e disponibiliza visão administrativa em lista e mapa.

## Stack

- Frontend: Next.js + React + TypeScript
- Backend: Node.js + Express + TypeScript
- IA: Google Gemini API
- Banco: PostgreSQL
- Validação: Zod
- Testes: Vitest (frontend e backend)

## Funcionalidades implementadas

- Formulário do cidadão para abrir solicitações com:
  - título
  - descrição
  - localização (texto + coordenadas)
- Triagem por IA com saída estruturada:
  - categoria
  - prioridade (`Alta`, `Média`, `Baixa`)
  - resumo técnico
- Normalização de endereço por coordenadas (quando `GOOGLE_MAPS_API_KEY` está configurada no backend)
- Painel administrativo em lista (`/admin-list`) com:
  - filtros por endereço, categoria, prioridade e status
  - paginação
  - atualização de status por botões segmentados
  - mapa de detalhe do chamado selecionado
- Painel administrativo em mapa (`/admin-list/map`) com:
  - mesmos filtros do painel de lista
  - status padrão em `Pendente`
  - carregamento em lotes de 1000 até buscar todas as páginas
  - cluster automático por zoom (ativo em zoom <= 15, inativo em zoom > 15)
  - renderização incremental por bounds para manter performance
  - marcadores por categoria (ícones customizados)
  - InfoWindow com informações principais do chamado

## Regras de domínio e contrato

- Categorias aceitas são fechadas (lista permitida no backend).
- Prioridade é validada por enum (`Alta`, `Média`, `Baixa`) no backend.
- Status aceitos: `Pendente`, `Resolvida`, `Cancelada`.
- Endpoint de atualização de status é único:
  - `PATCH /requests/:id/status`

## IA e resiliência

- A chamada ao Gemini possui retry para falhas transitórias (até 3 tentativas com backoff).
- Falhas da IA são propagadas com erro tipado (`AIProviderError`), permitindo resposta HTTP consistente:
  - `503` para cenário equivalente a rate limit (ex.: 429)
  - `502` para demais falhas de provider

## Arquitetura (resumo)

Fluxo principal:

1. Frontend envia solicitação para `POST /requests`.
2. Backend valida payload com Zod.
3. Backend normaliza endereço (opcional, via geocoding reverso).
4. Backend chama serviço de triagem IA (Gemini).
5. Backend persiste no PostgreSQL.
6. Frontend administrativo consulta `GET /requests` para renderizar lista e mapa.

Backend:

- `controllers`: camada HTTP
- `schemas`: validação de entrada
- `services`: regras de negócio (triagem, normalização)
- `repositories`: acesso a dados

Frontend:

- `features/report`: formulário público
- `features/admin-list`: painel em lista
- `features/admin-list-map`: painel em mapa
- `features/maps`: componentes/serviços compartilhados de mapa

## Estrutura de pastas

```txt
backend/
  src/
    modules/
      requests/
      categories/
      health/
    db/
frontend/
  app/
    admin-list/
    admin-list/map/
  src/features/
    report/
    admin-list/
    admin-list-map/
    maps/
```

## Variáveis de ambiente

### Backend (`backend/.env`)

Use `backend/.env.example` como base:

```env
PORT=3333
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash ou gemma-3-27b-it(mais testes grátis por dia)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Frontend (`frontend/.env.local`)

Use `frontend/.env.example` como base:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3333
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Como rodar localmente

Pré-requisitos:

- Node.js 20+
- npm 10+
- PostgreSQL acessível pela `DATABASE_URL`

### Backend

```bash
cd backend
npm install
npm run dev
```

API padrão: `http://localhost:3333`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App padrão: `http://localhost:3000`

## Testes e validação

### Backend

```bash
cd backend
npm run build
npm test
```

### Frontend

```bash
cd frontend
npm run lint
npm test
npm run build
```

Se existir pasta `coverage/` local e o lint acusar warning de arquivo gerado, rode:

```bash
npm run lint -- --ignore-pattern coverage/**
```

## Endpoints principais

- `POST /requests`
  - Cria solicitação com triagem IA
- `GET /requests`
  - Lista solicitações com filtros e paginação
  - Query params:
    - `search` (endereço)
    - `category`
    - `priority`
    - `status`
    - `page`
    - `limit` (máximo 1000)
- `GET /requests/:id`
  - Detalhe de solicitação
- `PATCH /requests/:id/status`
  - Atualiza status da solicitação
- `GET /health`
  - Health check

## Rotas de interface

- `/` - formulário do cidadão
- `/admin-list` - painel administrativo em lista
- `/admin-list/map` - painel administrativo em mapa
