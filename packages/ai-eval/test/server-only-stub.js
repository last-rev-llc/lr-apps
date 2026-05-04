// Stub for vitest to allow importing modules guarded by `import "server-only"`.
// In production builds Next.js applies its react-server condition, but vitest
// runs in plain Node and would otherwise hit the package's throwing index.js.
export {};
