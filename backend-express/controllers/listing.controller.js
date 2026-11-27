import mongoose from "mongoose";
import Listing from "../models/listing.model.js";
import { generateToken, tokenDigest, compareToken } from "../utils/token.js";

// GET /api/listings
export const getListings = async (req, res, next) => {
  try {
    const {
      q,
      kind,
      category,
      location,
      date_from,
      date_to,
      status = "active",
    } = req.query;

    const filter = {};

    // Filter by listing status
    if (status !== "all") {
      if (!["active", "resolved"].includes(status)) {
        return res.status(400).json({
          message: "Invalid listing status",
        });
      }

      filter.resolved = status === "resolved";
    }

    // Search title, description, location and category
    if (q?.trim()) {
      const searchRegex = new RegExp(
        q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { category: searchRegex },
      ];
    }

    // Filter by kind
    if (kind) {
      if (!["lost", "found"].includes(kind)) {
        return res.status(400).json({
          message: "Invalid listing kind",
        });
      }

      filter.kind = kind;
    }

    if (category) {
      filter.category = category;
    }

    if (location?.trim()) {
      filter.location = {
        $regex: location.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    // Date filtering
    if (date_from || date_to) {
      filter.event_date = {};

      if (date_from) {
        const from = new Date(`${date_from}T00:00:00.000Z`);

        if (Number.isNaN(from.getTime())) {
          return res.status(400).json({
            message: "Invalid start date",
          });
        }

        filter.event_date.$gte = from;
      }

      if (date_to) {
        const to = new Date(`${date_to}T23:59:59.999Z`);

        if (Number.isNaN(to.getTime())) {
          return res.status(400).json({
            message: "Invalid end date",
          });
        }

        filter.event_date.$lte = to;
      }
    }

    const listings = await Listing.find(filter)
      .sort({ created_at: -1, _id: -1 })
      .limit(100);

    res.status(200).json(listings.map((listing) => listing.toJSON()));
  } catch (error) {
    next(error);
  }
};

export const getListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid listing ID",
      });
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

export const createListing = async (req, res, next) => {
  try {
    const {
      title,
      description,
      kind,
      category,
      location,
      event_date,
      contact,
      photo_url,
    } = req.body;

    // Basic required-field validation
    if (
      !title?.trim() ||
      !description?.trim() ||
      !kind ||
      !category?.trim() ||
      !location?.trim() ||
      !event_date
    ) {
      return res.status(400).json({
        message: "All required fields must be provided",
      });
    }

    if (!["lost", "found"].includes(kind)) {
      return res.status(400).json({
        message: "Kind must be lost or found",
      });
    }

    const eventDate = new Date(event_date);

    if (Number.isNaN(eventDate.getTime())) {
      return res.status(400).json({
        message: "Invalid event date",
      });
    }

    // Generate resolution token
    const token = generateToken();

    const listing = await Listing.create({
      title,
      description,
      kind,
      category,
      location,
      event_date: eventDate,
      contact,
      photo_url: photo_url || null,
      resolve_token_hash: tokenDigest(token),
    });

    // Never return the stored token hash
    const publicListing = listing.toObject();

    delete publicListing.resolve_token_hash;

    res.status(201).json({
      ...publicListing,
      resolve_token: token,
    });
  } catch (error) {
    next(error);
  }
};

export const resolveListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid listing ID",
      });
    }

    if (typeof token !== "string" || !token) {
      return res.status(400).json({
        message: "Resolution token is required",
      });
    }

    const listing = await Listing.findById(id).select("+resolve_token_hash");

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    if (!compareToken(token, listing.resolve_token_hash)) {
      return res.status(403).json({
        message: "Resolve token is not valid for this listing",
      });
    }

    listing.resolved = true;

    await listing.save();

    const publicListing = listing.toObject();

    delete publicListing.resolve_token_hash;

    res.status(200).json(publicListing);
  } catch (error) {
    next(error);
  }
};
