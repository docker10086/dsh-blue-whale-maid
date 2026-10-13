import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const name = "dsh-blue-whale-maid";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(HERE, "..", "assets");
const MIME = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
};

function safeResolve(relativePath) {
  const target = path.normalize(path.join(ASSETS_DIR, relativePath));
  if (target !== ASSETS_DIR && !target.startsWith(ASSETS_DIR + path.sep)) return null;
  return target;
}

export async function apply(ctx) {
  ctx.inject(["webServer"], (webContext) => {
    const webServer = webContext.get("webServer");
    const dispose = webServer.register({
      kind: "exact",
      path: "/api/dsh-blue-whale-maid/assets",
      handler: async (req, res) => {
        try {
          const url = new URL(req.url, "http://127.0.0.1");
          const relativePath = (url.searchParams.get("f") ?? "").split("?")[0];
          const file = safeResolve(relativePath);
          if (file === null || !existsSync(file) || !statSync(file).isFile()) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("not found");
            return;
          }
          const type = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
          res.writeHead(200, {
            "Content-Type": type,
            "Cache-Control": "public, max-age=3600",
          });
          createReadStream(file).pipe(res);
        } catch (error) {
          res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(String(error?.message ?? error));
        }
      },
    });
    webContext.effect(() => dispose, "dsh-blue-whale-maid: static assets");
  });

  ctx.logger?.info?.("dsh-blue-whale-maid: mounted");
}

