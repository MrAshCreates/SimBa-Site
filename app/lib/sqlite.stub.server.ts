export function openFileSqlite(): never {
  throw new Error("File SQLite is not available on Cloudflare Workers. Bind D1 as DB.");
}
