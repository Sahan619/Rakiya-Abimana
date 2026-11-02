import { app } from "./app";

const PORT = parseInt(process.env.PORT || "5000", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`=======================================================`);
  console.log(`Jobs & Micro-Business Funding Platform (Sri Lanka) API`);
  console.log(`Server running at: http://localhost:${PORT}`);
  console.log(`Health check:     http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

