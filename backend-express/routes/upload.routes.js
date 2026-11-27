import express from "express";

import { upload, uploadPhoto } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/", upload.single("image"), uploadPhoto);

export default router;
