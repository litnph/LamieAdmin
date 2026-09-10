# Lamie Admin

React/Vite administration client for the Lamie API.

## Local development

Prerequisites:

- Node.js and npm
- `API_Lamie` running with its database configured

Install and start the Admin client:

```sh
npm install
npm run dev
```

The browser client never receives an AI provider key. Content generation calls the authenticated Lamie API, and OpenAI configuration belongs only in the server-side `API_Lamie` environment/configuration. If the server has no OpenAI key, the Content screen reports that generation is unavailable while the rest of Admin continues to work.

Migration, OpenAI, FE Data, shared-filesystem, and storefront build instructions are documented in the sibling runbook `API_Lamie/docs/INGREDIENTS_FE_DATA_CONTENT_RUNBOOK.md`.

Useful checks:

```sh
npm run typecheck
npm run test:e2e
npm run build
```
