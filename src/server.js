import dotenv from "dotenv";
dotenv.config();
import db from "./models/index.js";
import app from "./app.js";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { socketSetup } from "./realtime/socketSetup.js";
const PORT = process.env.PORT || 8000;
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:8000",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

socketSetup(io);

export { io };

db.sequelize
  .authenticate()
  .then(async () => {
    console.log("Database connected.");
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(() => {
    process.exit(1);
  });
