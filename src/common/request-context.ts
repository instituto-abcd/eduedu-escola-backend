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

// Reescreve o host de uma URL de asset que já foi persistida para o host da
// requisição atual. Alguns documentos guardam a URL absoluta montada no momento
// da sincronização (planets.avatar_url e, copiado dele, planetTrack.planetAvatar);
// quando o IP da máquina muda, essa URL para de ser alcançável pelos
// dispositivos da rede e a imagem aparece em branco. O caminho do arquivo
// continua válido, só o host precisa acompanhar a requisição.
export function rebaseAssetUrl(url?: string | null): string | null {
  if (!url) {
    return url ?? null;
  }

  const baseUrl = RequestContext.baseUrl();
  if (!baseUrl) {
    return url;
  }

  try {
    const { pathname, search } = new URL(url);
    return `${baseUrl}${pathname}${search}`;
  } catch {
    // URL relativa ou malformada: não há host para reescrever.
    return url;
  }
}
