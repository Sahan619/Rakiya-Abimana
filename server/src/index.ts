import { app } from "./app";
import { validateEncryptionKey } from "./services/crypto.service";

const PORT = parseInt(process.env.PORT || "5000", 10);

try {
  validateEncryptionKey();
} catch {
  console.error("Secure startup blocked: ENCRYPTION_KEY is missing or invalid.");
  process.exit(1);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`=======================================================`);
  console.log(`Jobs & Micro-Business Funding Platform (Sri Lanka) API`);
  console.log(`Server running at: http://localhost:${PORT}`);
  console.log(`Health check:     http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

