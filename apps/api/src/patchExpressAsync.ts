/**
 * Express 4 does not forward rejected promises from async route handlers to the
 * error middleware. An unhandled rejection (e.g. Prisma cannot reach Postgres)
 * exits the Node process — Render then reports exit code 1 and a 502 loop.
 *
 * Handlers are registered on `Route.prototype`, not `Router.prototype`.
 */
import type { RequestHandler } from "express";
import { Router } from "express";

const HTTP_METHODS = [
  "all",
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
] as const;

function wrapAsync(handler: RequestHandler): RequestHandler {
  if (handler.length === 4) {
    return handler;
  }
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function patchMethod(
  proto: Record<string, unknown>,
  method: (typeof HTTP_METHODS)[number]
) {
  const original = proto[method];
  if (typeof original !== "function") {
    return;
  }
  proto[method] = function (this: unknown, ...args: unknown[]) {
    const handlers = args.map((arg) =>
      typeof arg === "function" ? wrapAsync(arg as RequestHandler) : arg
    );
    return (original as (...a: unknown[]) => unknown).apply(this, handlers);
  };
}

const probeRouter = Router();
const probeRoute = probeRouter.route("/__async_patch_probe__");
const routeProto = Object.getPrototypeOf(probeRoute) as Record<string, unknown>;
for (const method of HTTP_METHODS) {
  patchMethod(routeProto, method);
}

const routerProto = Object.getPrototypeOf(probeRouter) as Record<string, unknown>;
const originalUse = routerProto.use as (
  this: Router,
  ...args: unknown[]
) => Router;
routerProto.use = function (this: Router, ...args: unknown[]) {
  const wrapped = args.map((arg) =>
    typeof arg === "function" ? wrapAsync(arg as RequestHandler) : arg
  );
  return originalUse.apply(this, wrapped);
};
