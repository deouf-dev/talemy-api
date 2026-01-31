import dotenv from "dotenv";
dotenv.config();
import db from "./models/index.js";
import app from "./app.js";

const PORT = process.env.PORT || 3000;

db.sequelize.authenticate().then(async () => {
  console.log("Database connected.");
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
