import { app, pool } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    server.close(() => {
      void pool.end().then(() => process.exit(0));
    });
  });
}
