import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import Sequelize from "sequelize";
import { fileURLToPath } from "url";
import process from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import configFile from "../../config/config.json" with { type: "json" };
const env = process.env[configFile.use_env_variable] || "development";
const config = configFile[env];

const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);

const modelFiles = fs
  .readdirSync(__dirname)
  .filter(
    (file) =>
      file !== "index.js" && file.endsWith(".js") && !file.endsWith(".test.js"),
  );

for (const file of modelFiles) {
  const modulePath = path.join(__dirname, file);
  const modelModule = await import(modulePath);
  const model = modelModule.default(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

for (const model of Object.values(db)) {
  if (model.associate) model.associate(db);
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
