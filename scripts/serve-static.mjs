import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    port: { type: "string", default: process.env.PORT ?? "4173" },
    "base-path": {
      type: "string",
      default: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
    },
  },
});
const port = Number(values.port);
const basePath = values["base-path"].replace(/\/$/, "");
const root = resolve("out");
await stat(resolve(root, "index.html")).catch(() => {
  throw new Error("Static output is missing. Run npm run build first.");
});
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
  } catch {
    response.writeHead(400).end("Invalid URL");
    return;
  }
  if (basePath && pathname === basePath) {
    response.writeHead(301, { Location: basePath + "/" }).end();
    return;
  }
  if (basePath && !pathname.startsWith(basePath + "/")) {
    response.writeHead(404).end("Not found");
    return;
  }
  const relative = pathname.slice(basePath.length).replace(/^\/+/, "");
  let filename = resolve(root, relative);
  if (filename !== root && !filename.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(filename)).isDirectory())
      filename = resolve(filename, "index.html");
    const body = await readFile(filename);
    response.writeHead(200, {
      "Content-Type":
        contentTypes[extname(filename)] ?? "application/octet-stream",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    const body = await readFile(resolve(root, "404.html")).catch(
      () => "Not found",
    );
    response.end(request.method === "HEAD" ? undefined : body);
  }
});
server.listen(port, "127.0.0.1", () => {
  process.stdout.write(
    `Static preview: http://127.0.0.1:${port}${basePath}/\n`,
  );
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close());
