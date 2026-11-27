import express from "express";

import {
  getListings,
  getListing,
  createListing,
  resolveListing,
} from "../controllers/listing.controller.js";

const router = express.Router();

router.get("/", getListings);

router.get("/:id", getListing);

router.post("/", createListing);

router.patch("/:id/resolve", resolveListing);

export default router;
