declare module "cloudflare:workers" {
  export const env: {
    DB?: unknown;
    SIMBA_OWNER_PASSWORD?: string;
    [key: string]: unknown;
  };
}
