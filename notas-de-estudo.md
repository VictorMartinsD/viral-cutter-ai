# Notas de Estudo - Cutter.ai

## — Português (pt-BR) —

## 📌 Visão Geral do Projeto

- Projeto frontend em JavaScript modular (sem framework) para automatizar a identificação de cortes virais em vídeos longos.
- Fluxo técnico principal: upload e processamento de vídeo com Cloudinary, análise de transcrição com Gemini, e persistência local de configurações e histórico.
- Problema resolvido: reduzir trabalho manual de revisão de vídeo e padronizar critérios de seleção de cortes via prompts reutilizáveis.
- Foco técnico: integrações externas, organização modular por responsabilidade, UX responsiva com tema claro/escuro e validação robusta de entradas.

## 🧠 Conceitos e Tecnologias Aplicadas

- Arquitetura modular ES6 com separation of concerns.
- Estrutura component-like orientada a módulos e blocos de UI reutilizáveis (sem framework de componentes).
- Hooks: não aplicável no sentido de React Hooks; o projeto usa listeners, funções utilitárias e estado centralizado em objeto.
- Estado centralizado em objeto de aplicação para rastreabilidade de fluxo.
- DOM caching para reduzir consultas repetidas e melhorar performance.
- Persistência em localStorage com chaves versionadas para evolução de schema.
- Validação em camadas (atributos HTML + listeners + validação no salvamento).
- Integração de APIs externas com camada dedicada (api.js).
- Prompt-driven content analysis para inferência de momentos virais.
- Responsive design e estratégia de tema claro/escuro via class strategy.
- Progressive enhancement para experiências com e sem animação (prefers-reduced-motion).

## ⚙️ Decisões Técnicas Importantes

- Escolha por Vanilla JS + Vite para reduzir overhead de framework e manter build/development rápido.
- Separação por módulos: index.js (orquestração), api.js (integrações), storage.js (persistência), theme.js (tema), utils.js (helpers).
- Camada de serviços orientada por responsabilidades: api.js para serviços externos, storage.js para persistência local e utils.js para funções transversais.
- Estratégia de estado object-based para simplicidade operacional em aplicação de porte pequeno/médio.
- Uso de localStorage no lugar de backend para acelerar prototipagem e manter autonomia do frontend.
- Tailwind via CDN + CSS modular para equilíbrio entre produtividade e controle fino de estilos.
- Dependências externas focadas em necessidade real: Cloudinary (upload/transcrição), Gemini (análise), GSAP (animações de UX).
- Decisão de manter scripts e setup em formato copiável no README para reduzir atrito de onboarding.

## 🧩 Problemas Resolvidos

### 1) Integração Cloudinary após migração de build

- Contexto: widget de upload parou de funcionar após ajustes de bundler.
- Causa: ordem de carregamento do script global do Cloudinary.
- Solução aplicada: garantir carregamento antes do módulo principal e usar referência via window.cloudinary.
- Aprendizado: bibliotecas globais exigem controle explícito de script order.

### 2) Limite de caracteres em campos dinâmicos

- Contexto: campos criados dinamicamente não respeitavam limite esperado em todos os cenários.
- Causa: dependência exclusiva de maxlength e ausência de validação complementar.
- Solução aplicada: abordagem em profundidade com validação por input/paste e saneamento no save.
- Aprendizado: validação confiável precisa de múltiplas camadas.

### 3) Queda de fluidez em animações no mobile

- Contexto: scroll animations com custo elevado em dispositivos restritos.
- Causa: excesso de trabalho de animação em ambiente com menor capacidade.
- Solução aplicada: detecção de prefers-reduced-motion e degradação controlada de animações.
- Aprendizado: acessibilidade e performance caminham juntas.

### 4) Evolução de dados persistidos sem quebra

- Contexto: necessidade de evoluir estrutura salva no navegador.
- Causa: risco de incompatibilidade entre versões de dados.
- Solução aplicada: versionamento de keys e estratégia de migração no carregamento.
- Aprendizado: versionar armazenamento local evita regressão silenciosa.

## 🛠️ Boas Práticas Aplicadas

- Clean Code com nomes semânticos e funções com responsabilidade única.
- Modularização por contexto de domínio e baixo acoplamento entre módulos.
- Reuso de utilitários para evitar duplicação de lógica.
- Tratamento de erro e fallback em pontos de integração externa.
- Consistência de validação e limites de input em diferentes pontos de entrada.
- Padronização de scripts e instruções de setup para facilitar onboarding.
- Documentação bilíngue no README para ampliação de alcance técnico.

## 📚 Aprendizados Técnicos

- Consolidação de integrações frontend-first com serviços externos (Cloudinary/Gemini).
- Melhoria de critério para decidir entre simplicidade arquitetural e escalabilidade futura.
- Evolução em desenho de estado sem dependência de bibliotecas de estado.
- Melhor entendimento de trade-offs entre UX rica (animação) e custo de renderização.
- Maturidade em documentação técnica: separar visão de produto (README) de histórico de estudo (notas).

## 🔄 Próximos Passos (Opcional)

- Adicionar testes de unidade para utils e storage.
- Criar testes de integração para fluxos críticos (upload, análise, persistência).
- Evoluir camada de API com retries, timeout e classificação de erros.
- Introduzir observabilidade básica (logs estruturados e métricas de fluxo).
- Considerar migração para IndexedDB se volume de dados crescer.
- Avaliar redução progressiva de arquivo monolítico em index.js com feature modules.

> [!NOTE]
> Estas notas são um resumo técnico do projeto.
> O processo detalhado com todos os desafios resolvidos está documentado nos meus arquivos pessoais de estudo.
> [Veja as anotações completas deste projeto aqui](https://www.notion.so/NLW-22-Rocketseat-32234764478b80579cb9ff6488fa6d3f?source=copy_link)

---

## — English (en-US) —

## 📌 Project Overview

- Frontend project built with modular JavaScript (framework-free) to automate viral clip extraction from long-form videos.
- Main technical flow: video upload/processing through Cloudinary, transcript analysis with Gemini, and local persistence of configurations/history.
- Problem addressed: reduce manual review effort and standardize clip selection criteria through reusable prompts.
- Technical focus: external integrations, module-oriented organization, responsive UX with light/dark theme, and robust input validation.

## 🧠 Concepts and Applied Technologies

- ES6 modular architecture with separation of concerns.
- Component-like structure based on reusable UI blocks (without a component framework).
- Hooks: not applicable in the React sense; the project relies on event listeners, utilities, and object-based state.
- Centralized app state object for predictable flow tracking.
- DOM caching to reduce repeated queries and improve performance.
- localStorage persistence with versioned keys for schema evolution.
- Defense-in-depth input validation (HTML attributes + listeners + save-time checks).
- Dedicated integration layer for external services (api.js).
- Prompt-driven analysis strategy for viral moment detection.
- Responsive design and light/dark class-based theming.
- Progressive enhancement for reduced-motion environments.

## ⚙️ Important Technical Decisions

- Chose Vanilla JS + Vite to keep low framework overhead and fast dev/build cycles.
- Module boundaries: index.js (orchestration), api.js (integrations), storage.js (persistence), theme.js (theme), utils.js (helpers).
- Service boundaries by responsibility: api.js for external services, storage.js for local persistence, and utils.js for cross-cutting helpers.
- Object-based state strategy to keep implementation simple for small/medium scope.
- localStorage over backend to accelerate iteration and keep frontend autonomy.
- Tailwind (CDN) + modular CSS for productivity with styling control.
- Dependency choices driven by concrete needs: Cloudinary (upload/transcription), Gemini (analysis), GSAP (UX motion).
- Copy-friendly README command format to improve onboarding speed.

## 🧩 Solved Problems

### 1) Cloudinary integration after build migration

- Context: upload widget stopped working after bundler adjustments.
- Root cause: Cloudinary global script loading order.
- Applied solution: ensure script availability before main module and reference via window.cloudinary.
- Learning: global libraries require explicit script-order guarantees.

### 2) Character limit issues in dynamic fields

- Context: dynamically created fields did not always enforce limits.
- Root cause: relying only on maxlength without layered validation.
- Applied solution: defense-in-depth with input/paste guards and save-time sanitization.
- Learning: reliable validation must exist in multiple layers.

### 3) Animation stutter on mobile

- Context: scroll-based motion caused poor smoothness on constrained devices.
- Root cause: high animation/render workload.
- Applied solution: detect prefers-reduced-motion and gracefully reduce animations.
- Learning: accessibility decisions directly improve performance stability.

### 4) Safe persistence evolution

- Context: persisted browser data needed structural evolution.
- Root cause: backward compatibility risk across saved versions.
- Applied solution: key versioning plus migration at load time.
- Learning: versioned local persistence prevents silent regressions.

## 🛠️ Applied Best Practices

- Clean Code with semantic naming and single-responsibility functions.
- Domain-oriented modularization with low coupling.
- Utility reuse to avoid duplicated logic.
- Error handling and fallback behavior at external integration boundaries.
- Consistent validation across multiple user input paths.
- Standardized setup/documentation flow for easier onboarding.
- Bilingual technical documentation for broader accessibility.

## 📚 Technical Learnings

- Stronger capability in frontend-first integrations with external services.
- Better decision-making on simplicity vs. future scalability trade-offs.
- Improved reasoning about state design without dedicated state libraries.
- Deeper understanding of UX motion vs. runtime cost trade-offs.
- Better documentation practice by separating product README from study history.

## 🔄 Next Steps (Optional)

- Add unit tests for utils and storage modules.
- Add integration tests for critical flows (upload, analysis, persistence).
- Improve API layer with retries, timeouts, and error taxonomy.
- Add basic observability (structured logs and flow metrics).
- Consider IndexedDB migration for larger data volume.
- Split monolithic orchestration areas into feature-focused modules.

> [!NOTE]
> These notes are a technical summary of the project.
> The detailed process, including all solved challenges, is documented in my personal study files.
> [See the complete notes for this project here](https://www.notion.so/NLW-22-Rocketseat-32234764478b80579cb9ff6488fa6d3f?source=copy_link)
