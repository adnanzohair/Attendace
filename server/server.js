import "./src/config/env.js";
import app from "./src/app.js";
import { connectDatabase } from "./src/config/db.js";

if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
  console.error("MONGODB_URI and JWT_SECRET are required");
  process.exit(1);
}
try {
  await connectDatabase();
  const server = app.listen(process.env.PORT || 5000, () =>
    console.log(`Attendance API listening on ${process.env.PORT || 5000}`),
  );
  server.requestTimeout = 30000;
  server.headersTimeout = 35000;
} catch (error) {
  console.error("Unable to connect to MongoDB:", error.message);
  process.exit(1);
}
