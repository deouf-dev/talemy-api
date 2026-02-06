import { Router } from "express";
import {
  createContactRequest,
  getMyContactRequests,
  updateContactRequestStatus,
  cancelContactRequest,
} from "../services/requests/requests.service.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { assertOrThrow } from "../utils/index.js";
const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("STUDENT"),
  async (req, res, next) => {
    try {
      const { teacherUserId, message } = req.body;
      assertOrThrow(
        teacherUserId,
        400,
        "VALIDATION_ERROR",
        "teacherUserId is required",
      );
      const contactRequest = await createContactRequest({
        studentUserId: req.user.id,
        teacherUserId,
        message,
      });
      res.status(201).json({ contactRequest });
    } catch (error) {
      return next(error);
    }
  },
);

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    assertOrThrow(
      ["PENDING", "ACCEPTED", "REJECTED"].includes(req.query.status) ||
        !req.query.status,
      400,
      "VALIDATION_ERROR",
      "Invalid status filter",
    );
    const myRequests = await getMyContactRequests({
      userId: req.user.id,
      role: req.user.role,
      filterStatus: req.query.status,
    });
    res.status(200).json({ contactRequests: myRequests });
  } catch (error) {
    return next(error);
  }
});

router.patch(
  "/:requestId",
  requireAuth,
  requireRole("TEACHER"),
  async (req, res, next) => {
    assertOrThrow(
      ["PENDING", "ACCEPTED", "REJECTED"].includes(req.body.status),
      400,
      "VALIDATION_ERROR",
      "Invalid status value",
    );
    try {
      const updatedRequest = await updateContactRequestStatus(
        req.params.requestId,
        req.user.id,
        req.body.status,
      );
      res.status(200).json({ ...updatedRequest });
    } catch (error) {
      return next(error);
    }
  },
);

router.delete("/:requestId", requireAuth, async (req, res, next) => {
  try {
    const result = await cancelContactRequest(
      req.params.requestId,
      req.user.id,
    );
    res.status(204).send(result);
  } catch (error) {
    return next(error);
  }
});

export default router;
