# Smart Lab - Iot Frontend

Aplicação web frontend para gerenciamento de dispositivos IoT desenvolvida com Angular. O Smart Lab oferece uma interface moderna e responsiva para monitoramento, controle e gerenciamento de dispositivos conectados, sensores e ambientes.

## Demo

Uma demonstração da aplicação pode ser encontrada em: https://ericarfs.github.io/koala-front-end/

## Funcionalidades

- **Dashboard Interativo**: Visualização de dados em tempo real com gráficos e métricas
- **Gerenciamento de Dispositivos**: CRUD completo para dispositivos IoT
- **Controle de Dispositivos**: Interface para controle e atuação de dispositivos
- **Gerenciamento de Sensores**: Configuração e monitoramento de tipos de sensores
- **Gerenciamento de Ambientes**: Organização de dispositivos por ambientes/locações
- **Atualização OTA**: Sistema de atualização Over-The-Air para dispositivos
- **Gerenciamento de Usuários**: Sistema de autenticação e controle de acesso
- **Interface Responsiva**: Design adaptável para desktop, tablet e mobile
- **Menu Colapsável**: Sidebar retrátil para otimização de espaço

## Tecnologias

- **Framework**: Angular 22.1.0
- **UI Libraries**:
  - Angular Material 22.2.5
  - Angular CDK 22.1.7
  - Tailwind CSS 4.1.12
- **Gráficos**:
  - ECharts 6.1.0
  - ngx-echarts 22.0.0
- **Internacionalização (i18n)**:
  - Transloco 8.4.0
- **Geração de PDF**:
  - jsPDF 4.2.1
- **Programação Reativa**:
  - RxJS 7.8.0

## Pré-requisitos

- Node.js 22 ou superior
- npm 11.19.0
- Angular CLI 22.1.8

## Instalação

1. Clone o repositório:

```bash
git clone <repository-url>
cd koala-frontend
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
# Edite src/environments/environment.ts com as configurações da API
```

4. Inicie o servidor de desenvolvimento:

```bash
npm start
# ou
ng serve
```

A aplicação estará disponível em `http://localhost:4200/`

## Build

```bash
npm run build
```

Os arquivos compilados estarão em `dist/koala-frontend/browser/`

## Estruturas do Projeto

### 1. Estrutura de Pastas

```
public/
└── i18n/                    # Arquivos de internacionalização
src/
├── app/
│   ├── core/                # Núcleo da aplicação
│   │   ├── auth/            # Autorização (guards, interceptors, services)
│   │   ├── extensions/      # Arquivos de extensão
│   │   └── layout/          # Layout base da aplicação
│   ├── features/            # Páginas da aplicação
│   │   ├── dashboard/       # Dashboard principal
│   │   ├── devices/         # Gerenciamento de dispositivos
│   │   ├── device-types/    # Tipos de sensores
│   │   ├── locations/       # Ambientes
│   │   ├── users/           # Usuários
│   │   ├── ota/             # Atualização OTA
│   │   └── ...
|   ├── domains/             # Módulos de extensão
│   │   ├── aircon/          # Módulo principal - controle de ar-condicionados
│   │   └── ...
│   ├── shared/
│   │   ├── components/      # Componentes compartilhados
│   │   ├── domains/         # Serviços, componentes e definições específicas por domínio
│   │   ├── interfaces/      # Modelos de entidades
│   │   ├── layouts/         # Layouts compartilhados
│   │   ├── services/        # Serviços compartilhados
|   |   |   ├── pdf-export/  # Exportação de PDFs
|   |   |   └── ...
|   │   ├── tokens/          # Tokens
│   │   └── utils/           # Funções utilitárias
└── enviroments/             # Configurações de ambiente
```

### 2. Estrutura Arquitetural

- **Arquitetura Modular (Feature-based)**: Divisão clara de responsabilidades.
  - **Core**: configuração da aplicação e rotas principais, autenticação (guards, interceptor e serviço de sessão), layout e navegação, e o mecanismo de extensão (registro e definição de módulo)
  - **Shared**: componentes comuns (diálogos, campos de formulário, paginação e preferências de interface), modelos (interfaces), serviços, stores e componentes compartilhados, organizados por domínio (dispositivos, locais, monitoramento, entre outros), além de tokens e funções utilitárias.
  - **Features**: funcionalidades base do sistema (login, convidado, dashboard, ambientes, dispositivos, tipos de sensores, usuários e conta).
  - **Domains**: módulos de domínio integrados ao núcleo, cada um com suas páginas, rotas, serviços e modelos.
- **Arquitetura em Camadas**: O fluxo de dados segue a hierarquia: `Backends (API)` ➔ `Serviços  (Comunicação)` ➔ `Stores (Estado)` ➔ `Features/Domains (UI)`.
  - **UI (Componentes)**: Camada de Apresentação: exibem os dados e capturam interações do usuário.
  - **Stores (Estado)**: Camada de gerenciamento de estado. Eles guardam os dados em memória, gerenciam estados de carregamento/erro e notificam a UI de forma reativa.
  - **Services (Serviços)**: Camada de comunicação e acesso a dados. Eles são responsáveis por fazer as chamadas HTTP (Rest) e lidar com os fluxos de eventos em tempo real (SSE) e entregam os dados para o Store.
  - **Backends**: Camada externa que fornece os dados.

  > **Exemplo de Fluxo:** O Componente pede os dados ao _Store_. O _Store_ chama o _Service_. O _Service_ faz a requisição HTTP ao _Backend_. A resposta volta pelo _Service_, é guardada no _Store_, e o _Store_ atualiza o _Componente_ automaticamente.

### 3. Mecanismo de Extensão

Para facilitar a manutenção e expansão do sistema, o repositório conta com um guia prático intitulado [`HOW_TO_ADD_A_KOALA_MODULE.md`](https://github.com/ORIENTACOES-TCC-2026/projeto-erica/blob/main/koala-frontend/HOW_TO_ADD_A_KOALA_MODULE.md). O documento explica detalhadamente como futuros desenvolvedores podem registrar e adicionar novos módulos ao frontend da aplicação.

### 4. Variáveis de Ambientes

As URLs das APIs são configuradas nos arquivos em `src/environments/`:

- `apiUrl`: URL base da API REST principal
- `otaUrl`: URL da API de OTA

### 5. Internacionalização (i18n)

O sistema utiliza Transloco para internacionalização. Os arquivos de tradução estão em `public/i18n/`. Para adicionar um novo idioma, crie um arquivo `<idioma>.json` e registre-o no `provideTransloco` em `app.config.ts`.

## Funcionalidades Principais

### Dashboard

- Visualização de dados em tempo real
- Gráficos interativos com normalização automática de timestamps
- Suporte para múltiplos dispositivos com alinhamento automático
- Métricas e estatísticas
- Tooltip robusto com tratamento de valores faltantes

### Dispositivos

- Listagem de dispositivos
- Cadastro e edição
- Monitoramento de status

### Controle de Dispositivos

- Interface para atuação
- Controle de ar-condicionado
- Comandos em tempo real

### Sensores

- Gerenciamento de tipos de sensores
- Configuração de parâmetros
- Histórico de leituras

### Ambientes

- Organização por locações
- Agrupamento de dispositivos
- Mapeamento de ambientes

### OTA (Over-The-Air)

- Atualização de firmware
- Gerenciamento de versões
- Distribuição de atualizações

## Autenticação

A aplicação utiliza autenticação baseada em JWT. O token é armazenado no `localStorage` e enviado automaticamente em todas as requisições HTTP através do interceptor de autenticação.

## Responsividade

A aplicação é totalmente responsiva com:

- **Desktop**: Sidebar fixa com opção de colapsar
- **Tablet**: Sidebar colapsada fixa, com expansão temporária ao clicar em um ícone
- **Mobile**: Menu hambúrguer com sidebar deslizante
