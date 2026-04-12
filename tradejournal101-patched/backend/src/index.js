import app from "./app.js";
import { initDb } from "./db/index.js";
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;
initDb().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
});