<a id="readme-pt"></a>

# Cutter.ai

<div align="center">

[![Acessar Deploy](https://img.shields.io/badge/Acessar%20Deploy-Github%20Pages-blue?style=for-the-badge)](https://victormartinsd.github.io/viral-cutter-ai/)
[![📘 Notas de Estudo](https://img.shields.io/badge/%F0%9F%93%98%20Notas%20de%20Estudo-Documenta%C3%A7%C3%A3o-0ea5e9?style=for-the-badge)](./notas-de-estudo.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://github.com/VictorMartinsD/viral-cutter-ai/blob/main/LICENSE)

Automação inteligente para criação de cortes virais a partir de vídeos longos, integrando Google Gemini e Cloudinary.

</div>

---

> Idioma desta seção: **Português (pt-BR)**.

<div align="center">

## Sumário | Summary

| Português                                                                                                                                                                                                                                                                                                                                                                                                                                                       | English                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| - [Sobre o Projeto](#sobre-o-projeto)<br>- [Funcionalidades](#funcionalidades)<br>- [🖼️ Preview](#preview-pt)<br>- [Arquitetura e Decisões Técnicas](#arquitetura-e-decisões-técnicas)<br>- [Tecnologias e Ferramentas](#tecnologias-e-ferramentas)<br>- [Como Rodar Localmente](#como-rodar-localmente)<br>- [Estrutura do Projeto](#estrutura-do-projeto)<br>- [Aprendizados e Crescimento](#aprendizados-e-crescimento)<br>- [README in English](#readme-en) | - [About the Project](#about-the-project)<br>- [Features](#features)<br>- [🖼️ Preview](#preview-en)<br>- [Architecture & Technical Decisions](#architecture--technical-decisions)<br>- [Technologies & Tools](#technologies--tools)<br>- [Getting Started](#getting-started)<br>- [Project Structure](#project-structure)<br>- [Learning & Growth](#learning--growth)<br>- [README em Português](#readme-pt) |

</div>

---

## Sobre o Projeto

**Cutter.ai** resolve o desafio de identificar e extrair momentos virais em vídeos longos de forma automática. O sistema integra três tecnologias-chave:

1. **Cloudinary** — Para upload, transcrição automática e processamento de vídeos
2. **Google Gemini** — Para análise de conteúdo e detecção de momentos virais
3. **Armazenamento Local** — Via localStorage para persistência instantânea de prompts e configurações

O fluxo é simples: usuário faz upload de vídeo → Cloudinary transcreve automaticamente → Gemini analisa a transcrição com prompts customizados → Sistema extrai o corte viral → Usuário baixa ou salva o resultado.

Diferencial técnico: prompts reutilizáveis organizados em configurações, permitindo que o usuário customize a análise de IA sem tocar em código.

---

## Funcionalidades

- **Upload de Vídeos** — Integração com Cloudinary Upload Widget para seleção e envio seguro
- **Transcrição Automática** — Cloudinary processa áudio e gera transcrição em tempo real
- **Detecção de Momentos Virais** — Google Gemini analisa transcrição com prompts customizados
- **Prompts Reutilizáveis** — Sistema de prompts com CRUD completo e configurações
- **Gestor de Configurações** — Agrupa prompts em perfis para diferentes estratégias de edição
- **Videoteca Salvos** — Armazena vídeos processados na sessão com seleção em lote
- **Tema Claro/Escuro** — Toggle automático com persistência em localStorage
- **Design Responsivo** — Interface adaptada para mobile (320px) até desktop (1920px)
- **Validação de Entrada** — Limites de caracteres em todos os campos (60/120/150/2000)
- **Segurança de API** — Campo oculto para chave Gemini com cópia segura

---

<a id="preview-pt"></a>

## 🖼️ Preview

Preview do site completo no desktop (modo escuro):

<div align="center">
  <img src="https://github.com/user-attachments/assets/55f9a72f-98cd-4afe-80ea-3f5a7ae5a877" alt="Preview completo do Cutter.ai no desktop em modo escuro" />
</div>

---

## Arquitetura e Decisões Técnicas

### Estrutura Modular ES6

O projeto adota uma arquitetura baseada em módulos funcionais com responsabilidades bem definidas:

```
src/js/
├── index.js           # Lógica principal, state management, DOM handlers
├── api.js             # Abstração de chamadas Gemini e processamento Cloudinary
├── storage.js         # Gerenciamento de localStorage com chaves versionadas
├── theme.js           # Toggle de tema claro/escuro com persistência
├── utils.js           # Funções utilitárias (ID generation, text truncation, HTML escape)
└── tailwind-config.js # Configuração Tailwind customizada
```

### Padrões de Arquitetura

**1. Separação de Responsabilidades**

- `index.js` — Orquestração e manipulação de DOM
- `api.js` — Integração com APIs externas (Gemini, Cloudinary)
- `storage.js` — Persistência de dados e versionamento de chaves
- `theme.js` — Lógica isolada de tema

**2. State Management Object-Based**

```javascript
const app = {
  prompts: [],
  promptConfigs: [],
  savedVideos: [],
  apiKeyRawValue: "",
  // ... demais estados
};
```

Abordagem centrada em um objeto `app` que centraliza todo estado da aplicação, facilitando debug e rastreamento.

**3. DOM Element Caching**

```javascript
const el = {
  root: document.documentElement,
  promptList: document.getElementById("promptList"),
  // ... todos os seletores usados
};
```

Cache de referências ao DOM para evitar múltiplas queries, otimizando performance.

**4. API Abstraction Layer**
Funções exportadas em `api.js` permitem fácil testabilidade e mock de dependências externas em contextos de teste.

**5. Input Validation**

```javascript
const INPUT_LIMITS = {
  promptTitle: 60,
  promptText: 2000,
  videoTitle: 120,
  apiKey: 150,
};
```

Validação centralizada com trim() nos pontos de salvamento, garantindo consistência.

**6. localStorage com Versionamento**

```javascript
const storageKeys = {
  prompts: "clipmaker-prompts-v1",
  promptConfigs: "clipmaker-prompt-configs-v1",
  savedVideos: "clipmaker-saved-videos-v1",
};
```

Chaves versionadas permitem evolução segura do schema sem conflitos.

---

## Tecnologias e Ferramentas

### Core

| Tecnologia             | Versão    | Função                                                                                                       |
| ---------------------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| **Vite**               | ^8.0.3    | Build tool otimizado com HMR (Hot Module Replacement) rápido, reduzindo tempo de feedback em desenvolvimento |
| **Vanilla JavaScript** | ES6       | Framework-less, modular via imports/exports, mantendo codebase leve e performático                           |
| **HTML5**              | Semântico | Estrutura acessível com proper heading hierarchy e ARIA attributes onde necessário                           |

### Styling

| Tecnologia        | Versão | Função                                                                                                      |
| ----------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| **Tailwind CSS**  | CDN    | Utility-first CSS com suporte a tema claro e escuro via class strategy, customização via tailwind.config.js |
| **CSS Modular**   | Nativo | 7 arquivos CSS bem estruturados (reset, base, layout, components, modules, global)                          |
| **CSS Variables** | Nativo | Transições e animações via custom properties (--state-transition-duration, --state-transition-ease)         |

### Animações

| Tecnologia         | Versão | Função                                                                                 |
| ------------------ | ------ | -------------------------------------------------------------------------------------- |
| **GSAP**           | 3.12.5 | ScrollTrigger e ScrollToPlugin para animações fluidas em scroll e transições de estado |
| **CSS Animations** | Nativo | Keyframes customizados (video-scan, hero-gradient-flow, highlighting)                  |

### External Integrations

| Serviço           | Função                                                                       | Benefício Técnico                                                                               |
| ----------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Cloudinary**    | Upload widget, transcrição automática, processamento de vídeos               | Infrastructure pronta para mídia, transcription via IA (Whisper), storage seguro com CDN global |
| **Google Gemini** | Análise de transcrição, detecção de momentos virais via prompts customizados | IA multimodal sem necessidade de treinamento, resposta rápida em tempo real                     |
| **Google Fonts**  | Manrope (body) e Sora (display)                                              | Tipografia otimizada com variable fonts, melhorando UX e performance                            |
| **Lucide Icons**  | Icons SVG para UI components                                                 | ~7KB minificado, icon set profissional e customizável                                           |

### Frontend Infrastructure

| Tecnologia       | Versão    | Função                                                                      |
| ---------------- | --------- | --------------------------------------------------------------------------- |
| **localStorage** | HTML5 API | Persistência de estado sem backend, carregamento instantâneo em nova sessão |
| **Fetch API**    | Nativo    | HTTP requests async para Gemini e transcrição validation                    |

### Tooling & Development

| Ferramenta      | Versão   | Função                                                |
| --------------- | -------- | ----------------------------------------------------- |
| **Prettier**    | latest   | Code formatting automático (HTML, CSS, JS)            |
| **ESLint**      | Latest   | Linting configurável (lint, lint:fix, check commands) |
| **Husky**       | ^9.1.7   | Git hooks para rodar Prettier em pre-commit           |
| **lint-staged** | ^16.2.7  | Executa linting apenas em arquivos staged             |
| **npm**         | Built-in | Package manager e scripts automation                  |

---

## Como Rodar Localmente

### Pré-requisitos

- Node.js 16+ (npm 8+)
- Chave de API do Google Gemini (obtém-se em [Google AI Studio](https://aistudio.google.com/))
- (Opcional) Credenciais Cloudinary se quiser customizar o upload widget

### Instalação e Setup

1. Clone o repositório:

```bash
git clone https://github.com/VictorMartinsD/viral-cutter-ai.git
```

2. Entre no diretório do projeto:

```bash
cd viral-cutter-ai
```

3. Instale as dependências:

```bash
npm install
```

4. (Opcional, recomendado) Configure as variáveis de ambiente:

Crie um arquivo `.env` na raiz (não versionado no git) ou insira a chave da Gemini diretamente na interface antes de subir vídeos.

5. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Servidor em `http://localhost:5173` (ou URL alternativa se a porta estiver em uso).

### Scripts Disponíveis

```bash
npm run dev       # Inicia servidor de desenvolvimento com HMR
npm run build     # Build para produção (output: dist/)
npm run preview   # Preview local do build gerado
npm run lint      # Verifica problemas no código (ESLint)
npm run lint:fix  # Corrige problemas automaticamente
npm run format    # Formata código com Prettier
npm run check     # Executa lint e format juntos
```

### Workflow Típico de Desenvolvimento

1. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

2. (Opcional) Em outro terminal, rode a formatação:

```bash
npm run format
```

---

## Estrutura do Projeto

```
viral-cutter-ai/
├── index.html                 # Entry point com scripts e meta tags
├── package.json               # Dependências e scripts npm
├── package-lock.json          # Lock file (determinismo)
├── tailwind.config.js         # Config Tailwind (estilos, tema claro/escuro)
├── .prettierrc                # Config Prettier (formatting)
├── .gitignore                 # Arquivos ignorados do git
├── LICENSE                    # MIT License
│
├── src/
│   ├── js/
│   │   ├── index.js           # 2100+ linhas - Lógica principal, state, handlers
│   │   ├── api.js             # Integração Cloudinary + Gemini
│   │   ├── storage.js         # localStorage CRUD
│   │   ├── theme.js           # Toggle de tema claro/escuro
│   │   ├── utils.js           # Helpers (ID generation, truncation, etc)
│   │   └── tailwind-config.js # Customização Tailwind via CDN
│   │
│   └── css/
│       ├── index.css          # Import principal de todos os CSS
│       ├── reset.css          # CSS reset moderno
│       ├── base.css           # Estilos base (html, body, keyframes)
│       ├── layout.css         # Layout com gradientes e auras
│       ├── components.css     # Componentes (modal, dialog, etc)
│       ├── modules.css        # Módulos específicos (prompts, videos, configs)
│       └── global.css         # Globais (FOUC prevention, animations)
│
├── assets/
│   └── img/
│       ├── favicon.png        # Logo/favicon
│       └── preview.png        # Preview para OG tags
│
├── dist/                      # Build output (gerado)
└── node_modules/              # Dependências npm (não versionado)
```

### Responsabilidades por Diretório

**`src/js/`** — Lógica de negócio e orquestração

- Gerenciamento de estado (prompts, configs, vídeos)
- Handlers de eventos (upload, edição, deleção)
- Integração com APIs
- Persistência de dados

**`src/css/`** — Design visual e responsividade

- Typography e color system (Tailwind)
- Layout grid/flex (Tailwind + custom)
- Componentes reutilizáveis
- Animações (GSAP + CSS)
- Tema claro/escuro (class strategy)

**`assets/`** — Mídia estática

- Imagens de branding
- Favicon com versionamento

---

## Aprendizados e Crescimento

### Desafios Técnicos Enfrentados

#### 1. **Integração Cloudinary pós-migração Vite**

**Problema:** Widget de upload deixou de funcionar após migração do build system.
**Root Cause:** Script loading order — Cloudinary script precisava estar carregado ANTES do módulo principal.
**Solução:** Remover `defer` do Cloudinary script e referenciar via `window.cloudinary` insteadof `cloudinary`.
**Aprendizado:** Script order importa; libs externas que registram globals precisam de atenção especial após bundler changes.

#### 2. **Validação de Input em Campos Dinâmicos**

**Problema:** Character limits não funcionavam em campos criados via `document.createElement()`.
**Root Cause:** `maxlength` HTML attribute não é propagado automaticamente; precisava de validação em múltiplas camadas.
**Solução:** Estratégia de defesa em profundidade (maxlength HTML + input/paste listeners + trim on save).
**Aprendizado:** Para segurança real, multi-layer validation é necessário; não confiar em um único ponto de entrada.

#### 3. **Performance com GSAP e Scroll Animations**

**Problema:** Animações travavam em mobile com scroll triggers.
**Solução:** Detectar `prefers-reduced-motion` e desabilitar GSAP para não impactar performance em dispositivos limitados.
**Aprendizado:** Accessibility features (prefers-reduced-motion) também beneficiam performance em geral.

#### 4. **localStorage Schema Evolution**

**Problema:** Como evitar breaking changes ao evoluir o schema de dados salvos?
**Solução:** Usar chaves versionadas (`clipmaker-prompts-v1`, `clipmaker-prompts-v2`) e migrate em loading.
**Aprendizado:** Versionamento em localStorage permite canary deployments e gradual rollout.

### Conhecimentos Adquiridos

- Arquitetura modular ES6 com separação clara de responsabilidades melhorou manutenção e evolução do projeto.
- Integrações com Cloudinary e Gemini reforçaram práticas de validação, fallback e resiliência em fluxos críticos.
- Estratégias de UX (tema claro/escuro, responsividade e redução de animações) equilibraram experiência e performance.

[Ver notas de estudo completas](./notas-de-estudo.md)

### Decisões Arquiteturais Futuras

1. **State Management Evoluído** — Se escalar, considerar sistema de reducers (Redux-like pattern)
2. **Service Workers** — Cache strategy para assets e API responses
3. **Component Framework** — Se UI complexity crescer (Web Components ou lightweight alternative)
4. **AI Prompt Versioning** — Tracking de qual prompt gerou qual resultado
5. **Analytics** — Compreender quais tipos de vídeo viralizam mais

---

## Desenvolvido por [Victor Martins](https://github.com/VictorMartinsD)

Front-End Developer focado em aplicações web modernas, performance e user experience. Especializado em arquitetura frontend escalável, integrações com APIs de IA, e design systems.

---

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

<a id="readme-en"></a>

# Cutter.ai

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Github%20Pages-blue?style=for-the-badge)](https://victormartinsd.github.io/viral-cutter-ai/)
[![📘 Study Notes](https://img.shields.io/badge/%F0%9F%93%98%20Study%20Notes-Documentation-0ea5e9?style=for-the-badge)](./notas-de-estudo.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://github.com/VictorMartinsD/viral-cutter-ai/blob/main/LICENSE)

Intelligent automation for creating viral video clips from long-form content, integrating Google Gemini and Cloudinary.

</div>

---

> Language of this section: **English (en-US)**.

---

## About the Project

**Cutter.ai** solves the challenge of identifying and extracting viral moments from long videos automatically. The system integrates three key technologies:

1. **Cloudinary** — For video upload, automatic transcription, and media processing
2. **Google Gemini** — For content analysis and viral moment detection via custom prompts
3. **Local Storage** — Via localStorage for instant persistence of prompts and configurations

The workflow is straightforward: user uploads video → Cloudinary auto-transcribes → Gemini analyzes transcription with custom prompts → system extracts viral clip → user downloads or saves result.

Technical differentiator: reusable prompts organized in configurations, allowing users to customize AI analysis without touching code.

---

## Features

- **Video Upload** — Cloudinary Upload Widget integration for secure file selection and transfer
- **Automatic Transcription** — Cloudinary processes audio in real-time via Whisper technology
- **Viral Moment Detection** — Google Gemini analyzes transcription with customizable prompts
- **Reusable Prompts** — Full CRUD system for prompts with configuration management
- **Configuration Manager** — Groups prompts into profiles for different editing strategies
- **Saved Videos Library** — Stores processed videos in session with batch selection
- **Light/Dark Theme** — Automatic toggle with localStorage persistence across sessions
- **Responsive Design** — Interface optimized from mobile (320px) to desktop (1920px)
- **Input Validation** — Character limits enforced across all fields (60/120/150/2000 chars)
- **API Key Security** — Hidden field for Gemini key with secure copy-to-clipboard

---

<a id="preview-en"></a>

## 🖼️ Preview

See images in the [Portuguese preview section](#preview-pt).

---

## Architecture & Technical Decisions

### Modular ES6 Architecture

The project follows a functional module-based architecture with well-defined responsibilities:

```
src/js/
├── index.js           # Main logic, state management, DOM handlers
├── api.js             # Abstraction layer for Gemini and Cloudinary calls
├── storage.js         # localStorage management with versioned keys
├── theme.js           # Light/dark theme toggle with persistence
├── utils.js           # Utility functions (ID generation, text truncation, HTML escape)
└── tailwind-config.js # Tailwind customization script
```

### Architectural Patterns

**1. Separation of Concerns**

- `index.js` — Orchestration and DOM manipulation
- `api.js` — External API integrations (Gemini, Cloudinary)
- `storage.js` — Data persistence and key versioning
- `theme.js` — Isolated theme logic

**2. Object-Based State Management**

```javascript
const app = {
  prompts: [],
  promptConfigs: [],
  savedVideos: [],
  apiKeyRawValue: "",
  // ... other state
};
```

Centralized `app` object manages all application state, enabling easier debugging and state tracing.

**3. DOM Element Caching**

```javascript
const el = {
  root: document.documentElement,
  promptList: document.getElementById("promptList"),
  // ... all DOM selectors used
};
```

Cached DOM references prevent multiple queries, improving performance.

**4. API Abstraction Layer**
Functions exported from `api.js` enable testability and dependency mocking in test contexts.

**5. Input Validation**

```javascript
const INPUT_LIMITS = {
  promptTitle: 60,
  promptText: 2000,
  videoTitle: 120,
  apiKey: 150,
};
```

Centralized validation with trim() at save points ensures consistency across the app.

**6. localStorage with Versioning**

```javascript
const storageKeys = {
  prompts: "clipmaker-prompts-v1",
  promptConfigs: "clipmaker-prompt-configs-v1",
  savedVideos: "clipmaker-saved-videos-v1",
};
```

Versioned keys enable safe schema evolution without data conflicts.

---

## Technologies & Tools

### Core

| Technology             | Version  | Purpose                                                                                    |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------ |
| **Vite**               | ^8.0.3   | Optimized build tool with instant HMR (Hot Module Replacement), reducing dev feedback time |
| **Vanilla JavaScript** | ES6      | Framework-free, modular via imports/exports, keeping codebase lightweight and performant   |
| **HTML5**              | Semantic | Accessible structure with proper heading hierarchy and ARIA attributes                     |

### Styling

| Technology        | Version | Purpose                                                                                            |
| ----------------- | ------- | -------------------------------------------------------------------------------------------------- |
| **Tailwind CSS**  | CDN     | Utility-first CSS with light and dark theme support via class strategy, customized via config file |
| **Modular CSS**   | Native  | 7 well-structured CSS files (reset, base, layout, components, modules, global)                     |
| **CSS Variables** | Native  | State transitions and animations via custom properties                                             |

### Animations

| Technology         | Version | Purpose                                                                       |
| ------------------ | ------- | ----------------------------------------------------------------------------- |
| **GSAP**           | 3.12.5  | ScrollTrigger and ScrollToPlugin for smooth scroll-based and state animations |
| **CSS Animations** | Native  | Custom keyframes (video-scan, hero-gradient-flow, highlighting)               |

### External Integrations

| Service           | Purpose                                                           | Technical Benefit                                                                      |
| ----------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Cloudinary**    | Upload widget, auto-transcription, video processing               | Ready-made media infrastructure, AI-powered transcription (Whisper), secure global CDN |
| **Google Gemini** | Transcription analysis, viral moment detection via custom prompts | Multimodal AI without training, fast real-time responses                               |
| **Google Fonts**  | Manrope (body) and Sora (display) typographies                    | Optimized typography with variable fonts, improving UX and performance                 |
| **Lucide Icons**  | SVG icons for UI components                                       | ~7KB minified, professional icon set with full customization                           |

### Frontend Infrastructure

| Technology       | Version   | Purpose                                                           |
| ---------------- | --------- | ----------------------------------------------------------------- |
| **localStorage** | HTML5 API | State persistence without backend, instant loading on new session |
| **Fetch API**    | Native    | Async HTTP requests for Gemini and transcription validation       |

### Tooling & Development

| Tool            | Version  | Purpose                                               |
| --------------- | -------- | ----------------------------------------------------- |
| **Prettier**    | latest   | Automatic code formatting (HTML, CSS, JS)             |
| **ESLint**      | Latest   | Configurable linting (lint, lint:fix, check commands) |
| **Husky**       | ^9.1.7   | Git hooks for running Prettier on pre-commit          |
| **lint-staged** | ^16.2.7  | Linting only on staged files                          |
| **npm**         | Built-in | Package manager and script automation                 |

---

## Getting Started

### Prerequisites

- Node.js 16+ (npm 8+)
- Google Gemini API key (get one at [Google AI Studio](https://aistudio.google.com/))
- (Optional) Cloudinary credentials to customize upload widget

### Installation & Setup

1. Clone the repository:

```bash
git clone https://github.com/VictorMartinsD/viral-cutter-ai.git
```

2. Navigate to the project directory:

```bash
cd viral-cutter-ai
```

3. Install dependencies:

```bash
npm install
```

4. (Optional, recommended) Set up environment variables:

Create a `.env` file in the project root (not version-controlled), or enter the Gemini key directly in the UI before uploading videos.

5. Start the development server:

```bash
npm run dev
```

Server runs at `http://localhost:5173` (or an alternative URL if the port is already in use).

### Available Scripts

```bash
npm run dev       # Start dev server with HMR
npm run build     # Build for production (output: dist/)
npm run preview   # Local preview of production build
npm run lint      # Check code with ESLint
npm run lint:fix  # Auto-fix linting issues
npm run format    # Format code with Prettier
npm run check     # Run lint and format together
```

### Typical Development Workflow

1. Start the development server:

```bash
npm run dev
```

2. (Optional) In another terminal, run formatting:

```bash
npm run format
```

---

## Project Structure

```
viral-cutter-ai/
├── index.html                 # Entry point with scripts and meta tags
├── package.json               # Dependencies and npm scripts
├── package-lock.json          # Lock file (determinism)
├── tailwind.config.js         # Tailwind config (light/dark styles)
├── .prettierrc                # Prettier formatting config
├── .gitignore                 # Git ignore rules
├── LICENSE                    # MIT License
│
├── src/
│   ├── js/
│   │   ├── index.js           # 2100+ lines - Main logic, state, handlers
│   │   ├── api.js             # Cloudinary + Gemini integration
│   │   ├── storage.js         # localStorage CRUD operations
│   │   ├── theme.js           # Light/dark theme toggle logic
│   │   ├── utils.js           # Helper functions (ID generation, truncation, etc)
│   │   └── tailwind-config.js # Tailwind customization via CDN
│   │
│   └── css/
│       ├── index.css          # CSS import entry point
│       ├── reset.css          # Modern CSS reset
│       ├── base.css           # Base styles (html, body, keyframes)
│       ├── layout.css         # Layout with gradients and auras
│       ├── components.css     # Components (modals, dialogs, etc)
│       ├── modules.css        # Specific modules (prompts, videos, configs)
│       └── global.css         # Global styles (FOUC prevention, animations)
│
├── assets/
│   └── img/
│       ├── favicon.png        # Logo/favicon
│       └── preview.png        # Preview for OG tags
│
├── dist/                      # Build output (generated)
└── node_modules/              # npm dependencies (not versioned)
```

### Directory Responsibilities

**`src/js/`** — Business logic and orchestration

- Application state management (prompts, configs, videos)
- Event handlers (upload, edit, delete)
- API integrations
- Data persistence

**`src/css/`** — Visual design and responsiveness

- Typography and color system (Tailwind)
- Layout patterns (grid/flex)
- Reusable components
- Animations (GSAP + CSS)
- Light/dark theme (class strategy)

**`assets/`** — Static media

- Branding images
- Favicon with versioning

---

## Learning & Growth

### Technical Challenges Solved

#### 1. **Cloudinary Integration Post-Vite Migration**

**Problem:** Upload widget stopped working after switching build systems.
**Root Cause:** Script loading order — Cloudinary script needed to load before main app module.
**Solution:** Remove `defer` from Cloudinary script and reference via `window.cloudinary`.
**Takeaway:** Script order matters; external libraries registering globals need special attention after bundler changes.

#### 2. **Input Validation in Dynamically-Created Fields**

**Problem:** Character limits failed on fields created via `document.createElement()`.
**Root Cause:** `maxlength` HTML attribute doesn't auto-propagate; needed multi-layer validation.
**Solution:** Defense-in-depth strategy (maxlength HTML + input/paste listeners + trim on save).
**Takeaway:** True security requires multi-layer validation; never trust a single entry point.

#### 3. **Performance with GSAP and Scroll Animations**

**Problem:** Animations stuttered on mobile with scroll triggers.
**Solution:** Detect `prefers-reduced-motion` and disable GSAP to avoid performance impact on resource-constrained devices.
**Takeaway:** Accessibility features (prefers-reduced-motion) also benefit overall performance.

#### 4. **localStorage Schema Evolution**

**Problem:** How to prevent breaking changes while evolving data schema?
**Solution:** Use versioned keys (`clipmaker-prompts-v1`, `clipmaker-prompts-v2`) and migrate during load.
**Takeaway:** Versioning in localStorage enables canary deployments and gradual rollouts.

### Knowledge Gained

- ES6 modular architecture with clear responsibility boundaries improved maintainability and scalability.
- Cloudinary and Gemini integrations strengthened validation, fallback, and resilience patterns in critical flows.
- UX strategies (light/dark theme, responsiveness, reduced-motion handling) improved usability without sacrificing performance.

[See full study notes](./notas-de-estudo.md)

### Future Architectural Considerations

1. **Advanced State Management** — Consider reducer pattern (Redux-like) if complexity grows
2. **Service Workers** — Cache strategy for assets and API responses
3. **Component Framework** — If UI complexity increases (Web Components or lightweight alternative)
4. **AI Prompt Versioning** — Track which prompt generated which results
5. **Analytics** — Understand which video types go viral most

---

## Built by [Victor Martins](https://github.com/VictorMartinsD)

Front-End Developer focused on modern web applications, performance, and user experience. Specialized in scalable frontend architecture, AI API integrations, and design systems.

---

## License

This project is licensed under the [MIT License](LICENSE).
