# Especificação de Produto — Cutter.ai

<div align="center">

## Sumário | Summary

| Português                                         | English                                     |
| ------------------------------------------------- | ------------------------------------------- |
| [Visão Geral do Produto](#visão-geral-do-produto) | [Product Overview](#product-overview)       |
| [Problema](#problema)                             | [Problem](#problem)                         |
| [Objetivo do Produto](#objetivo-do-produto)       | [Product Objective](#product-objective)     |
| [Usuário-Alvo](#usuário-alvo)                     | [Target User](#target-user)                 |
| [Funcionalidades](#funcionalidades)               | [Features](#features)                       |
| [Regras de Negócio](#regras-de-negócio)           | [Business Rules](#business-rules)           |
| [Fluxo do Usuário](#fluxo-do-usuário)             | [User Flow](#user-flow)                     |
| [MVP](#mvp)                                       | [MVP](#mvp-1)                               |
| [Decisões de Produto](#decisões-de-produto)       | [Product Decisions](#product-decisions)     |
| [Limitações Atuais](#limitações-atuais)           | [Current Limitations](#current-limitations) |
| [Próximos Passos](#próximos-passos)               | [Next Steps](#next-steps)                   |
| [Métricas de Sucesso](#métricas-de-sucesso)       | [Success Metrics](#success-metrics)         |

</div>

---

## Português

### Visão Geral do Produto

**Cutter.ai** é uma aplicação que automatiza a identificação e extração de momentos virais em vídeos. O sistema integra três tecnologias-chave para resolver um problema prático: transformar gravações em conteúdo otimizado para redes sociais de forma inteligente e rápida.

O usuário realiza um fluxo simples: faz upload do vídeo → a plataforma transcreve automaticamente → a IA analisa a transcrição → o sistema sugere os melhores cortes → o usuário baixa ou salva os resultados. Diferente de edição manual, que consome horas de trabalho e depende de critério humano inconsistente, o Cutter.ai oferece análise objetiva, rápida e reutilizável.

O valor entregue ao usuário é o tempo economizado, a consistência de critérios e a capacidade de iterar sobre diferentes estratégias de corte usando prompts personalizados.

### Problema

Produtores de conteúdo, educadores e empresas enfrentam um desafio crítico: gravar conteúdo em vídeo é relativamente simples, mas extrair momentos potencialmente virais desse conteúdo é extremamente trabalhoso.

O fluxo tradicional exige:

- Revisão manual de horas de vídeo
- Identificação subjetiva de momentos interessantes
- Edição e corte manual
- Iteração baseada em intuição
- Tempo significativo investido por editor profissional

Resultado: conteúdo valioso fica subutilizado porque o custo de processamento é muito alto, ou os critérios de seleção são inconsistentes entre sessões. Produtores perdem oportunidades de maximizar o alcance do seu conteúdo.

### Objetivo do Produto

Permitir que produtores de conteúdo identifiquem e extraiam automaticamente os momentos mais relevantes de vídeos, reduzindo significativamente o tempo de trabalho manual e oferecendo critérios consistentes e reutilizáveis para a seleção de cortes.

Após usar o Cutter.ai, o usuário consegue:

- Processar vídeos em minutos, em vez de horas de edição manual
- Aplicar critérios de seleção consistentes entre múltiplos vídeos
- Testar diferentes estratégias de corte usando prompts customizados
- Iterar rapidamente sobre resultados sem reprocessar vídeos

### Usuário-Alvo

**Perfil Principal:**

- Produtores de conteúdo (YouTube, TikTok, Instagram)
- Educadores e instrutores
- Empresas e profissionais que gravam apresentações ou reuniões
- Qualquer criador que trabalha com vídeo

**Nível Técnico:**

- Usuários iniciantes a intermediários
- Sem necessidade de conhecimento de programação
- Confortáveis com interfaces web modernas
- Dispostos a experimentar com diferentes configurações

**Contexto de Uso:**

- Necessidade periódica (semanal, mensal) de processar vídeos
- Ambiente de trabalho solo ou em pequenos times
- Busca por acelerar fluxo de produção
- Interesse em padronizar critérios de qualidade

### Funcionalidades

1. **Upload de Vídeos com Integração Cloudinary**
   - Usuário seleciona arquivo de vídeo via widget nativo
   - Sistema valida formato e tamanho
   - Upload seguro com armazenamento na plataforma Cloudinary

2. **Transcrição Automática**
   - Sistema processa áudio do vídeo em tempo real
   - Cloudinary extrai texto transcrito da gravação
   - Transcrição fica disponível para análise

3. **Detecção de Momentos Virais com IA**
   - Usuário insere chave da API Google Gemini
   - Sistema envia transcrição + prompt customizado para análise
   - Gemini identifica momentos que correspondem aos critérios do prompt
   - Sistema retorna sugestões estruturadas de cortes

4. **Sistema de Prompts Reutilizáveis**
   - Usuário cria, edita e deleta prompts personalizados
   - Cada prompt define critérios específicos para detecção (ex: "momentos engraçados", "insights valiosos", "chamadas para ação")
   - Prompts são salvos localmente para reuso imediato

5. **Gestor de Configurações**
   - Prompts são agrupados em configurações/perfis
   - Cada configuração agrupa múltiplos prompts relacionados
   - Permite switch rápido entre diferentes estratégias de edição

6. **Videoteca de Salvos**
   - Vídeos processados ficam organizados em histórico local
   - Seleção em lote de vídeos para operações em massa
   - Persistência na sessão do navegador

7. **Tema Claro e Escuro**
   - Toggle automático entre modo claro e escuro
   - Preferência persistida entre sessões
   - Respeta preferência do sistema operacional do usuário

8. **Responsividade Completa**
   - Interface funciona de forma consistente em mobile (320px), tablet (768px) e desktop (1920px)
   - Layout adaptativo sem perda de funcionalidade

9. **Validação Robusta de Entradas**
   - Limite de caracteres em todos os campos (títulos: 60, configurações: 120, prompts: 2000)
   - Validação em camadas (HTML + listeners + salvamento)
   - Mensagens de erro claras

### Regras de Negócio

- Transcrição só é gerada se upload for bem-sucedido
- Análise de IA só funciona se chave da API estiver válida e configurada
- Prompts vazios ou com menos de 10 caracteres não podem ser salvos
- Nomes de prompts e configurações não podem ser duplicados no mesmo contexto
- Limite de título de vídeo: 120 caracteres
- Limite de texto de prompt: 2000 caracteres
- Limite de título de configuração: 60 caracteres
- Chave da API é armazenada apenas na sessão, nunca em servidor
- Dados salvos ficam restritos ao navegador do usuário (localStorage)
- Seleção em lote valida que pelo menos um item está selecionado antes de operação em massa
- Sistema impede deleção de configuração se ela estiver em uso
- Tema é aplicado globalmente a toda interface

### Fluxo do Usuário

1. Usuário acessa a plataforma
2. Sistema detecta tema preferido (claro/escuro) e aplica automaticamente
3. Usuário insere chave da API Google Gemini no campo oculto
4. Usuário navega para seção de prompts e cria prompts personalizados (ex: "identificar piadas")
5. Usuário agrupa prompts em configurações (ex: "conteúdo cômico")
6. Usuário faz upload de vídeo via Cloudinary Upload Widget
7. Sistema transcreve vídeo automaticamente
8. Usuário seleciona configuração de prompts desejada
9. Sistema envia transcrição + prompts para Google Gemini
10. Gemini retorna análise com sugestões de cortes
11. Usuário visualiza sugestões de momentos virais
12. Usuário pode iterar com diferentes prompts/configurações
13. Usuário salva vídeo processado na videoteca local
14. Usuário baixa ou compartilha resultados

### MVP

O núcleo essencial do Cutter.ai é a capacidade de:

- Upload automático de vídeo
- Transcrição automática do áudio
- Análise de transcrição com IA usando prompts customizados
- Salvamento reutilizável de prompts

Sem essas funcionalidades, o produto deixa de existir. Tema claro/escuro, videoteca e configurações são adições valiosas, mas o MVP é caracterizado especificamente pelos quatro pontos acima.

### Decisões de Produto

1. **Prompts Reutilizáveis em Vez de Configuração Única**
   - _Decisão:_ Permitir que usuário crie múltiplos prompts e os agrupe em configurações
   - _Problema Resolvido:_ Usuários têm critérios diferentes para diferentes tipos de conteúdo. Uma configuração única seria inflexível.
   - _Benefício:_ Usuário pode iterar rapidamente entre estratégias sem reprocessar vídeo

2. **Armazenamento Local vs Backend**
   - _Decisão:_ Usar localStorage para persistência de prompts, configurações e histórico
   - _Problema Resolvido:_ Acelera prototipagem, reduz dependência de infraestrutura, melhora privacidade
   - _Benefício:_ Usuário tem total controle dos dados, nenhuma chamada de servidor necessária para CRUD

3. **Integração Cloudinary em Vez de Upload Simples**
   - _Decisão:_ Usar widget e APIs do Cloudinary para upload e transcrição
   - _Problema Resolvido:_ Upload nativo de vídeos é lento e propenso a erros. Cloudinary oferece transcrição automática (Whisper).
   - _Benefício:_ Escalabilidade, segurança, processamento de mídia profissional

4. **Tema Claro/Escuro com Persistência**
   - _Decisão:_ Toggle automático de tema com detecção de preferência do sistema
   - _Problema Resolvido:_ Usuários têm preferências visuais diferentes dependendo do contexto de uso
   - _Benefício:_ Experiência personalizada, conforto visual, acessibilidade aprimorada

5. **Chave da API no Campo Oculto**
   - _Decisão:_ Campo de input com máscara visual para Gemini API key
   - _Problema Resolvido:_ Segurança: chave não é armazenada em servidor, usuário tem controle total
   - _Benefício:_ Simplicidade operacional, zero dependência de autenticação backend, máxima privacidade

### Limitações Atuais

- Não possui persistência em banco de dados (dados ficam limitados a localStorage)
- Não suporta múltiplos usuários simultâneos
- Não possui autenticação ou sistema de contas
- Transcrição depende completamente da qualidade do áudio do vídeo
- Não integra com redes sociais para publicação direta
- Não possui histórico versionado de análises anteriores
- Limite de tamanho de vídeo definido por Cloudinary (depende de plano contratado)
- Não há API pública para integração em terceiros
- Análise de IA depende de qualidade e relevância do prompt fornecido pelo usuário
- Interface não suporta themes além de claro/escuro

### Próximos Passos

1. **Adicionar Salvamento em Backend** — Evoluir para persistência em banco de dados para permitir sincronização entre dispositivos
2. **Implementar Autenticação** — Sistema de contas para permitir múltiplos usuários e acesso multi-dispositivo
3. **Histórico e Versionamento** — Rastrear quais prompts foram usados em quais vídeos e como os resultados evoluíram
4. **Integração de Redes Sociais** — Publicação direta em TikTok, Instagram, YouTube com formatação automática
5. **Sugestões de Prompts** — IA sugere prompts relevantes baseado no conteúdo do vídeo
6. **Batch Processing** — Processar múltiplos vídeos em paralelo sem bloquear UI
7. **Análise de Performance** — Dashboard mostrando qual tipo de conteúdo performou melhor
8. **Export de Configurações** — Permitir compartilhamento de perfis de prompts entre usuários
9. **Web Workers** — Offload de processamento pesado para evitar bloqueio de UI

### Métricas de Sucesso

- **Taxa de Conclusão:** Usuário consegue fazer upload, transcrever e analisar um vídeo sem erro
- **Tempo de Processamento:** Redução de horas de edição manual para minutos de processamento automatizado
- **Reuso de Prompts:** Usuários criam múltiplos prompts e os reutilizam entre vídeos
- **Iteração de Análise:** Usuários testam múltiplas configurações de prompts no mesmo vídeo
- **Persistência em Sessão:** Dados salvos persistem entre recarregos da página
- **Responsividade:** Interface mantém funcionalidade completa em mobile, tablet e desktop
- **Taxa de Satisfação:** Usuário encontra o Cutter.ai útil para seu fluxo de trabalho

---

Documento de produto elaborado por Victor Martins.
Este documento descreve a visão funcional e estratégica do sistema.

---

## English

### Product Overview

**Cutter.ai** is an application that automates the identification and extraction of viral moments from videos. The system integrates three key technologies to solve a practical problem: transforming video recordings into optimized social media content intelligently and quickly.

The user follows a simple workflow: upload video → platform auto-transcribes → AI analyzes transcript → system suggests best clips → user downloads or saves results. Unlike manual editing, which consumes hours and relies on inconsistent human judgment, Cutter.ai offers objective, fast, and reusable analysis.

The value delivered to the user is saved time, consistency of criteria, and the ability to iterate over different cutting strategies using personalized prompts.

### Problem

Content creators, educators, and companies face a critical challenge: recording video content is relatively easy, but extracting potentially viral moments from that content is extremely time-consuming.

The traditional workflow requires:

- Manual review of hours of video
- Subjective identification of interesting moments
- Manual editing and cutting
- Iteration based on intuition
- Significant time investment by professional editors

Result: valuable content remains underutilized because processing cost is prohibitively high, or selection criteria are inconsistent between sessions. Creators miss opportunities to maximize their content's reach.

### Product Objective

Enable content creators to automatically identify and extract the most relevant moments from videos, significantly reducing manual work time and offering consistent, reusable criteria for clip selection.

After using Cutter.ai, the user can:

- Process videos in minutes, instead of hours of manual editing
- Apply consistent selection criteria across multiple videos
- Test different cutting strategies using custom prompts
- Iterate quickly over results without reprocessing videos

### Target User

**Primary Profile:**

- Content creators (YouTube, TikTok, Instagram)
- Educators and instructors
- Companies and professionals recording presentations or meetings
- Any creator working with video

**Technical Level:**

- Beginner to intermediate users
- No programming knowledge required
- Comfortable with modern web interfaces
- Willing to experiment with different configurations

**Usage Context:**

- Periodic need (weekly, monthly) to process videos
- Solo work or small team environment
- Interest in accelerating production workflow
- Desire to standardize quality criteria

### Features

1. **Video Upload with Cloudinary Integration**
   - User selects video file via native widget
   - System validates format and size
   - Secure upload with Cloudinary platform storage

2. **Automatic Transcription**
   - System processes video audio in real-time
   - Cloudinary extracts transcribed text from recording
   - Transcript becomes available for analysis

3. **Viral Moment Detection with AI**
   - User enters Google Gemini API key
   - System sends transcript + custom prompt for analysis
   - Gemini identifies moments matching prompt criteria
   - System returns structured clip suggestions

4. **Reusable Prompt System**
   - User creates, edits, and deletes personalized prompts
   - Each prompt defines specific detection criteria (e.g., "funny moments", "valuable insights", "calls to action")
   - Prompts are saved locally for immediate reuse

5. **Configuration Manager**
   - Prompts are grouped into configurations/profiles
   - Each configuration groups multiple related prompts
   - Enables quick switching between different editing strategies

6. **Saved Videos Library**
   - Processed videos are organized in local history
   - Batch selection of videos for mass operations
   - Persistence within browser session

7. **Light and Dark Theme**
   - Automatic toggle between light and dark mode
   - Preference persisted between sessions
   - Respects user's operating system preference

8. **Complete Responsiveness**
   - Interface works consistently on mobile (320px), tablet (768px), and desktop (1920px)
   - Adaptive layout without loss of functionality

9. **Robust Input Validation**
   - Character limits on all fields (titles: 60, configurations: 120, prompts: 2000)
   - Multi-layer validation (HTML + listeners + save-time checks)
   - Clear error messages

### Business Rules

- Transcription is only generated if upload succeeds
- AI analysis only works if API key is valid and configured
- Empty prompts or prompts with fewer than 10 characters cannot be saved
- Prompt and configuration names cannot be duplicated in same context
- Video title limit: 120 characters
- Prompt text limit: 2000 characters
- Configuration title limit: 60 characters
- API key is stored only in session, never on server
- Saved data is restricted to user's browser (localStorage)
- Batch selection validates that at least one item is selected before mass operation
- System prevents deletion of configuration if it is in use
- Theme is applied globally to entire interface

### User Flow

1. User accesses platform
2. System detects preferred theme (light/dark) and applies automatically
3. User enters Google Gemini API key in hidden field
4. User navigates to prompts section and creates personalized prompts (e.g., "identify jokes")
5. User groups prompts into configurations (e.g., "comedy content")
6. User uploads video via Cloudinary Upload Widget
7. System automatically transcribes video
8. User selects desired prompt configuration
9. System sends transcript + prompts to Google Gemini
10. Gemini returns analysis with clip suggestions
11. User views viral moment suggestions
12. User can iterate with different prompts/configurations
13. User saves processed video to local library
14. User downloads or shares results

### MVP

The core essence of Cutter.ai is the ability to:

- Automatically upload video
- Automatically transcribe audio
- Analyze transcript with AI using custom prompts
- Save and reuse prompts

Without these functionalities, the product ceases to exist. Light/dark theme, video library, and configurations are valuable additions, but the MVP is specifically characterized by the four points above.

### Product Decisions

1. **Reusable Prompts Instead of Single Configuration**
   - _Decision:_ Allow user to create multiple prompts and group them into configurations
   - _Problem Addressed:_ Users have different criteria for different content types. A single configuration would be inflexible.
   - _Benefit:_ User can quickly iterate between strategies without reprocessing video

2. **Local Storage vs Backend**
   - _Decision:_ Use localStorage for persistence of prompts, configurations, and history
   - _Problem Addressed:_ Accelerates prototyping, reduces infrastructure dependency, improves privacy
   - _Benefit:_ User has total data control, no server calls needed for CRUD

3. **Cloudinary Integration Instead of Simple Upload**
   - _Decision:_ Use Cloudinary widget and APIs for upload and transcription
   - _Problem Addressed:_ Native video upload is slow and error-prone. Cloudinary offers automatic transcription (Whisper).
   - _Benefit:_ Scalability, security, professional media processing

4. **Light/Dark Theme with Persistence**
   - _Decision:_ Automatic theme toggle with system preference detection
   - _Problem Addressed:_ Users have different visual preferences depending on usage context
   - _Benefit:_ Personalized experience, visual comfort, improved accessibility

5. **API Key in Hidden Field**
   - _Decision:_ Input field with visual masking for Gemini API key
   - _Problem Addressed:_ Security: key is not stored on server, user has total control
   - _Benefit:_ Operational simplicity, zero backend authentication dependency, maximum privacy

### Current Limitations

- No database persistence (data limited to localStorage)
- Does not support multiple simultaneous users
- No authentication or account system
- Transcription completely depends on video audio quality
- No direct integration with social networks for publishing
- No versioned history of previous analyses
- Video size limit defined by Cloudinary (depends on plan)
- No public API for third-party integration
- AI analysis depends on quality and relevance of user-provided prompt
- Interface supports only light/dark themes

### Next Steps

1. **Add Backend Persistence** — Evolve to database persistence to enable sync across devices
2. **Implement Authentication** — Account system to enable multiple users and multi-device access
3. **History & Versioning** — Track which prompts were used on which videos and how results evolved
4. **Social Network Integration** — Direct publishing to TikTok, Instagram, YouTube with automatic formatting
5. **Prompt Suggestions** — AI suggests relevant prompts based on video content
6. **Batch Processing** — Process multiple videos in parallel without blocking UI
7. **Performance Analytics** — Dashboard showing which content types performed best
8. **Configuration Export** — Allow sharing prompt profiles between users
9. **Web Workers** — Offload heavy processing to avoid UI blocking

### Success Metrics

- **Completion Rate:** User successfully uploads, transcribes, and analyzes a video without error
- **Processing Time:** Reduction from hours of manual editing to minutes of automated processing
- **Prompt Reuse:** Users create multiple prompts and reuse them across videos
- **Analysis Iteration:** Users test multiple prompt configurations on the same video
- **Session Persistence:** Saved data persists across page reloads
- **Responsiveness:** Interface maintains full functionality on mobile, tablet, and desktop
- **Satisfaction Rate:** User finds Cutter.ai useful for their workflow

---

Product document prepared by Victor Martins.
This document describes the functional and strategic vision of the system.
