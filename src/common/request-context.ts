import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response, NextFunction } from 'express';

type RequestContextStore = { baseUrl: string };

const storage = new AsyncLocalStorage<RequestContextStore>();

export const RequestContext = {
  // Base URL (protocolo + host) da requisição HTTP atual, ou null fora de
  // contexto HTTP (ex.: jobs do Bull), onde o fallback é FILE_SERVER_URL.
  baseUrl(): string | null {
    return storage.getStore()?.baseUrl ?? null;
  },
};

export function requestContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const host = req.get('host');
  if (!host) {
    return next();
  }
  storage.run({ baseUrl: `${req.protocol}://${host}` }, () => next());
}
