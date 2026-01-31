import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import teacherRoutes from "./routes/teachers.routes.js";
import studentRoutes from "./routes/students.routes.js";
import subjectRoutes from "./routes/subjects.routes.js";
import requestRoutes from "./routes/requests.routes.js";

const app = express();

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/teachers", teacherRoutes);
app.use("/students", studentRoutes);
app.use("/subjects", subjectRoutes);
app.use("/requests", requestRoutes);
app.use(errorHandler);
export default app;
