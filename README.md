# Kaos

Componentes y estilos comunes de todas las webs de Kaoticode: menú inferior
(`KaosDock`), barra superior (`KaosTopBar`), pie (`KaosFooter`), patrocinadores,
avisos, contacto, pasaporte, aviso de versión nueva…

**Se cambian aquí una vez y llegan a todas las webs.** Las webs no tienen su
propia copia: en `src/shared/kaos/` solo hay una línea por archivo que reexporta
este paquete (y `brand.ts`, que sí es de cada web).

## Cómo se cambia algo

1. Edita el archivo en `src/` y súbelo a `main` con una PR.
2. Crea una versión: en GitHub → *Releases* → *Draft a new release*, etiqueta
   nueva (`v1.0.1`, `v1.1.0`…) y *Publish*.
3. El workflow **«Actualizar las webs»** abre una PR en cada web con la versión
   nueva. Revísala (Vercel deja una vista previa) y fusiónala.

El workflow necesita el secreto `KAOS_SYNC_TOKEN` (ver más abajo).

## Uso en una web

```jsonc
// package.json
"@kaoticode/kaos": "github:Kaoticode/kaos#v1.0.0"
```

```ts
// next.config.ts: el paquete se publica en TypeScript
transpilePackages: ["@kaoticode/kaos"],
```

```ts
import KaosFooter from "@kaoticode/kaos/KaosFooter";
import { KAOS_APPS } from "@kaoticode/kaos/KaosApps";
```

```css
@import "@kaoticode/kaos/kaos.css";
```

Los iconos de las apps siguen en `public/kaos/apps/` de cada web.

## Secreto `KAOS_SYNC_TOKEN`

Token de GitHub (*fine-grained*) con acceso a los repos de las webs y permisos
**Contents: Read and write** y **Pull requests: Read and write**. Se guarda en
este repo: *Settings → Secrets and variables → Actions → New repository secret*.

Componentes: `KaosDock`, `KaosTopBar`, `KaosFooter`, `KaosSponsors`, `KaosFeedback`,
`KaosContact`, `KaosPassport`, `KaosUpdate`, `KaosScrollTop`, `KaosMarquee` y
`KaosShare` (botón de compartir: hoja nativa del móvil o panel con WhatsApp,
Telegram, X, Facebook, correo y copiar enlace).

Las normas de diseño están en [DESIGN.md](DESIGN.md).
