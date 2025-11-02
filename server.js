// server.js
import app from "./api/drugs.js";

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running locally on http://localhost:${PORT}`);
});
