---
name: create-api
description: Create or change API endpoints in the JJWings TypeScript and Express backend, following its routing, validation, authentication, service, and response conventions.
---

# Create API endpoints in JJWings Backend

Use this skill when implementing or modifying an API endpoint in this repository. Start by inspecting the relevant model, nearby route/controller/service code, and `startup/routes.ts`; follow the existing shape where it fits the requested behavior.

## Project conventions

- The app mounts the main router at `/v1/api`; feature routers are mounted at `/v1/api/<feature>` in `startup/routes.ts`. Add a feature router there when creating a new router, and keep its import and mount consistent with nearby entries.
- Routes live in `routes/`, request handlers in `controllers/`, business and database operations in `service/`, Mongoose models in `models/`, and Zod schemas in `validates/index.ts`.
- Feature routes generally import controller and schema modules, then declare HTTP method, path, middleware, and handler. Reuse `authenticate`, `authorizeAdmin`, or `authorizeSuperAdminRole` as required by the endpoint’s intended access. Derive identity and tenant scope from authenticated `req.user` where appropriate; do not trust client-supplied identity when the authenticated user already supplies it.
- Define request validation with Zod in `validates/index.ts` and attach `validate(schema)` to routes for validated JSON bodies. The current `validate` middleware parses `req.body` only and does not replace `req.body` with parsed/coerced data; handle path parameters and query parameters explicitly in the controller or service.
- Keep controllers focused on HTTP input/output and delegate persistence or domain behavior to services. Services use the existing Mongoose models, commonly imported from `../models`; preserve tenant and ownership filters in database operations.
- Responses commonly use `{ success: true, message, data }` or `{ success: true, message, result }`, with status `200`. Match the closest related endpoint unless the request calls for a different status or response contract.
- The shared error handler is mounted last in `startup/routes.ts`. Use existing error types from `errors/` where they fit; avoid adding ad hoc error handling that bypasses the project’s response conventions.
- The repository contains both TypeScript and legacy JavaScript service code. Follow the language and module style of the files being extended rather than converting unrelated code.

## Implementation

1. Clarify the endpoint’s method, path, access roles, inputs, output, and data ownership from the request and neighboring code. Ask only if a missing product rule materially affects behavior; otherwise use the closest established convention.
2. Trace the relevant model and existing service operations before changing persistence behavior. Preserve existing API contracts and avoid unrelated refactors.
3. Add or update the schema, service, controller, and route as needed. Register a new feature router in `startup/routes.ts`. If extending the main router, place the route with the related endpoint group.
4. Keep request validation, authorization, and tenant/ownership checks close to the route and data operation. Do not expose sensitive model fields accidentally; shape returned data when the endpoint requires a narrower response.
5. Summarize the endpoint path, access requirements, request/response shape, and files changed. Report any assumptions that affect the contract.

## Useful references

- `routes/feed.route.ts`, `controllers/feed.controller.ts`, and `service/feed.service.ts` show a feature router with authentication, validation, controller delegation, and Mongoose operations.
- `routes/game.route.ts` and its corresponding controller/service show additional route middleware and a compact endpoint implementation.
- `routes/index.ts` and `controllers/index.ts` contain the larger shared API surface and are used when a feature is organized in the central router.
- `middleware/validate.ts`, `middleware/auth.ts`, `validates/index.ts`, `startup/routes.ts`, and `errors/` define the shared middleware, schema, mounting, and error behavior.
