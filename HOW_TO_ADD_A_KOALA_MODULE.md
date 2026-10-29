# Como adicionar um módulo ao Koala Frontend

## 1. O que é um módulo e quando criar um

Um **módulo de domínio** é uma área nova do sistema com páginas, rotas, serviços e modelos próprios. Ele é integrado ao núcleo por uma definição registrada na configuração da aplicação, e não exige alterar as rotas, o menu ou os componentes do núcleo.

## 2. Como funciona

```
domains/<nome>/<nome>.module-definition.ts
        │  exporta uma KoalaModuleDefinition
        ▼
app.config.ts  →  provideKoalaModule(<nome>ModuleDefinition)
        │
        ▼
ExtensionRegistryService
  ├─ valida: descarta, com aviso no console, módulos sem loader ou com id/rota repetidos
  ├─ buildRoutes(): gera a rota do módulo, anexada ao MainLayout (herda o authGuard)
  └─ getMenuItems(): gera o grupo do módulo na barra lateral
```

O registro é feito em **tempo de compilação**: o módulo é empacotado com a aplicação e carregado sob demanda (lazy loading) quando o usuário o visita.

## 3. Antes de começar

```bash
npm install

npm start  # ou
ng serve
```

A aplicação estará disponível em `http://localhost:4200/`

- **Login:** enquanto o login estiver simulado, qualquer usuário e senha entram como **administrador**. Isso muda quando o login real for ativado.
- **Leia primeiro** `domains/aircon/` (`aircon.module-definition.ts`, `aircon.routes.ts` e `pages/device-control/`).
- **Versão do Node:** v24.21.0.

## 4. Passo a passo: criando o módulo `demo`

O exemplo cria um módulo `demo` com uma página inicial. Troque `demo` pelo nome do seu domínio.

### Passo 1: criar a estrutura de pastas

```
src/app/domains/demo/
├── demo.module-definition.ts
├── demo.routes.ts
├── models/              (se houver modelos)
├── services/            (se houver serviços)
└── pages/
    └── demo-home/
        ├── demo-home.ts
        └── demo-home.html
```

### Passo 2: criar a página

`pages/demo-home/demo-home.ts`

```ts
import { Component } from "@angular/core";
import { TranslatePipe } from "@ngx-translate/core";

@Component({
  selector: "app-demo-home",
  imports: [TranslatePipe],
  templateUrl: "./demo-home.html",
})
export class DemoHome {}
```

`pages/demo-home/demo-home.html`

```html
<h1 class="text-2xl font-semibold">{{ 'DEMO.TITLE' | translate }}</h1>
```

- Textos visíveis passam pela tradução (`translate`), nunca escritos direto no HTML.
- Use as classes de cor **semânticas** do projeto (veja `src/styles.css`) em vez de cores fixas, para o tema claro e escuro funcionarem.

### Passo 3: declarar as rotas do módulo

`demo.routes.ts`

```ts
import { Routes } from "@angular/router";

export const DEMO_ROUTES: Routes = [
  {
    path: "",
    children: [
      { path: "", redirectTo: "home", pathMatch: "full" },
      {
        path: "home",
        loadComponent: () =>
          import("./pages/demo-home/demo-home").then((m) => m.DemoHome),
      },
    ],
  },
];
```

- Os caminhos são **relativos ao módulo**: o registro monta `/demo` e o resultado final é `/demo/home`.
- O `redirectTo` da raiz **precisa apontar para uma rota que existe** no módulo.

### Passo 4: escrever a definição do módulo

`demo.module-definition.ts`

```ts
import { KoalaModuleDefinition } from "@core/extensions/koala-module-definition";

export const demoModuleDefinition: KoalaModuleDefinition = {
  id: "demo",
  label: "MENU.DEMO", // chave de tradução
  routePath: "demo",
  icon: "fa-solid fa-flask",
  order: 50,
  loadChildren: () => import("./demo.routes").then((m) => m.DEMO_ROUTES),
  subItems: [
    {
      id: "home",
      label: "MENU.DEMO_HOME",
      routePath: "demo/home", // caminho completo, com o prefixo do módulo
      icon: "fa-solid fa-house",
    },
  ],
};
```

### Passo 5: registrar em `app.config.ts`

São **duas linhas**: o `import` e o `provideKoalaModule`.

```ts
import { demoModuleDefinition } from './domains/demo/demo.module-definition';

// dentro de providers:
provideKoalaModule(demoModuleDefinition),
```

### Passo 6: acrescentar as traduções

Nos arquivos de idioma, em `public/i18n/`, acrescente as chaves em português e em inglês:

```json
{
  "MENU": { "DEMO": "Demonstração", "DEMO_HOME": "Início" },
  "DEMO": { "TITLE": "Módulo de demonstração" }
}
```

```json
{
  "MENU": { "DEMO": "Demo", "DEMO_HOME": "Home" },
  "DEMO": { "TITLE": "Demo module" }
}
```

Siga a estrutura já usada pelos arquivos existentes. Se uma chave não existir, a interface mostra o texto da chave como está, o que denuncia a falta de tradução.

### Passo 7: verificar

Com `npm start` ou `ng serve`, confira:

| Verificação                              | Esperado                                                                                |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| Barra lateral                            | Aparece o grupo "Demonstração", na posição definida por `order`, com o subitem "Início" |
| Clique no subitem                        | Abre `/demo/home`                                                                       |
| Recarregar a página em `/demo/home` (F5) | A página continua abrindo                                                               |
| Console do navegador                     | Nenhum aviso `[koala] Módulo "demo" ignorado`                                           |
| Idioma e tema                            | A página funciona em português e inglês, nos temas claro e escuro                       |

## 5. Referência do contrato (`KoalaModuleDefinition`)

Arquivo: `src/app/core/extensions/koala-module-definition.ts`.

| Campo                             | Obrigatório | Descrição                                                                                                                           |
| --------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `id`                              | Sim         | Identificador único do módulo                                                                                                       |
| `label`                           | Sim         | Título do grupo no menu, tratado como chave de tradução; se não houver chave, o texto é exibido como está                           |
| `routePath`                       | Sim         | Prefixo da rota do módulo                                                                                                           |
| `loadChildren` ou `loadComponent` | Um dos dois | Carregamento sob demanda das rotas ou de um componente                                                                              |
| `icon`                            | Não         | Ícone do grupo                                                                                                                      |
| `order`                           | Não         | Posição do grupo no menu                                                                                                            |
| `adminOnly`                       | Não         | `true`: o módulo só aparece no menu e só é acessível a administradores                                                              |
| `menuGroup`                       | Não         | Grupo de navegação ao qual o item pertence: `'monitoring'` ou `'settings'`; se não for definido nenhum, é considerado um novo grupo |
| `subItems`                        | Não         | Itens do grupo próprio, cada um com `id`, `label`, `routePath` e `icon`                                                             |
| `meta`                            | Não         | Metadados livres                                                                                                                    |

## 6. Convenções

**Regra de dependência:** Um módulo importa **apenas de `core` e `shared`**, nunca de `features` nem de outro módulo. Isso é uma convenção; nenhuma ferramenta a impõe ainda.

**Onde cada coisa fica:**

- Componente usado só no módulo: dentro do módulo. Vai para `shared/components` apenas quando um segundo uso aparecer.
- Imports com os aliases `@core/...` e `@shared/...`, em vez de caminhos relativos longos.
- Nomes: pasta e arquivos em minúsculas com hífen; classes em PascalCase.
- Não altere arquivos de `core/` para acomodar um módulo.

**Interface:**

- Reutilize os componentes de `shared/components` (diálogos, campos, paginação, botões de ação) e o layout de página de `shared/layouts`.
- Estilize com Tailwind e classes semânticas; não escreva cores fixas.
- Todo texto visível usa tradução, em português e inglês.
- Acessibilidade: elementos clicáveis devem ser `<button>` ou `<a>`, com foco por teclado e rótulo. O lint acusa os casos mais comuns.
- Teste a página em tema claro e escuro, em português e inglês, e com a fonte ampliada.

**Ícones:** As definições usam classes da biblioteca Font Awesome (`fa-solid fa-*`), na versão gratuita.

## 7. Onde olhar no código

| O quê                                          | Arquivo                                                    |
| ---------------------------------------------- | ---------------------------------------------------------- |
| Contrato do módulo                             | `src/app/core/extensions/koala-module-definition.ts`       |
| Registro (validação, rotas e menu)             | `src/app/core/extensions/extension-registry.ts`            |
| Token e `provideKoalaModule`                   | `src/app/core/extensions/koala-module-extensions.token.ts` |
| Registro dos módulos e inicialização das rotas | `src/app/app.config.ts`                                    |
| Rotas base e layout principal                  | `src/app/app.routes.ts`                                    |
| Menu lateral                                   | `src/app/core/layout/navbar/`                              |
