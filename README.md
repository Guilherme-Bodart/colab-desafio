# Desafio Técnico: Colab - Zeladoria Inteligente com IA

## 1. Contexto do Cenário

O Colab conecta cidadãos ao governo para resolver problemas urbanos. Um dos maiores gargalos das prefeituras é a triagem manual de milhares de solicitações diárias. Uma descrição vaga como "Tem um buraco aqui na frente" precisa ser classificada corretamente (ex: Manutenção de Vias) e priorizada antes de chegar à equipe de obras.

Sua missão: Desenvolver uma prova de conceito (PoC) de uma aplicação que utilize Inteligência Artificial Generativa para automatizar a triagem e enriquecer os dados reportados pelo cidadão.

## 2. O Desafio (Escopo)

Você deve criar uma aplicação Fullstack simples composta por:

- Frontend: Uma interface onde o cidadão relata o problema.
- Backend: Uma API que recebe o relato, processa com IA e salva o resultado.
- Integração IA: Um módulo que interpreta o texto livre e devolve dados estruturados.

## 3. Requisitos Técnicos Obrigatórios

### Frontend (Cidadão)

- Desenvolvido em React.js ou Next.js utilizando TypeScript.
- Formulário simples contendo: Título, Descrição do problema e Localização (campo de texto ou coordenadas simuladas).
- Feedback visual de carregamento (enquanto a IA processa) e confirmação de sucesso.

### Backend (API)

- Desenvolvido em Node.js/NestJS.
- Deve expor um endpoint (REST) para receber a solicitação.
- Integração com LLM: Embora nossa stack oficial utilize AWS Bedrock, para esta PoC você tem liberdade para utilizar APIs gratuitas ou em tier de teste. O objetivo é avaliar como você orquestra a chamada e trata o retorno, não o modelo em si.
- Banco de Dados: Salvar a solicitação processada em PostgreSQL ou MongoDB.

### Integração com IA

A IA deve retornar estritamente um JSON (independente do texto de entrada) contendo:

- Categoria sugerida (ex: Iluminação, Via Pública, Saneamento);
- Prioridade baseada na gravidade do texto (Baixa, Média, Alta);
- Resumo técnico (uma reescrita formal e impessoal do problema para o gestor público).

### Sugestões Gratuitas/Free Tier

- Google Gemini API (via Google AI Studio): Possui um free tier generoso para testes.
- Groq Cloud: Oferece acesso gratuito e extremamente rápido a modelos open-source (como Llama 3 e Mixtral), ideal para demonstrar performance.

### Diferenciais

- Validação de dados (ex: Zod).
- Cobertura de testes (Unitários ou Integração).
- Dockerização da aplicação.

## 4. O que será avaliado?

Este case foi desenhado para validar as competências descritas na nossa vaga:

- Arquitetura e Clean Code: Como você organiza pastas, separa responsabilidades e lida com a tipagem no TypeScript. Buscamos soluções escaláveis e sustentáveis.
- Integração com IA: Avaliaremos a qualidade do seu prompt para a LLM. Como você garante que a IA não devolva alucinações ou formatos inválidos?
- UX/UI: A interface é amigável e foca no cliente/cidadão?

## 5. Entregáveis

- Link para repositório público (GitHub/GitLab/Bitbucket).
- O README.md do repositório deve incluir:
  - Instruções de como rodar o projeto localmente.
  - Explicação da arquitetura: Um parágrafo ou diagrama simples explicando suas escolhas.
  - Se utilizou variáveis de ambiente (.env), envie um exemplo ou template.
