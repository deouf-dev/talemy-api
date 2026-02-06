import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import teacherRoutes from "./routes/teachers.routes.js";
import studentRoutes from "./routes/students.routes.js";
import subjectRoutes from "./routes/subjects.routes.js";
import requestRoutes from "./routes/requests.routes.js";
import conversationRoutes from "./routes/conversations.routes.js";
import lessonRoutes from "./routes/lessons.routes.js";
import reviewRoutes from "./routes/reviews.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import cors from "cors";
const app = express();

app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/teachers", teacherRoutes);
app.use("/students", studentRoutes);
app.use("/subjects", subjectRoutes);
app.use("/requests", requestRoutes);
app.use("/conversations", conversationRoutes);
app.use("/lessons", lessonRoutes);
app.use("/reviews", reviewRoutes);
app.use("/availability", availabilityRoutes);
app.use(errorHandler);

export default app;
