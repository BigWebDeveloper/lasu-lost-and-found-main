import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    kind: {
      type: String,
      enum: ["lost", "found"],
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    event_date: {
      type: Date,
      required: true,
    },

    contact: {
      type: String,
      default: "",
      trim: true,
    },

    photo_url: {
      type: String,
      default: null,
    },

    resolved: {
      type: Boolean,
      default: false,
    },

    resolve_token_hash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },

    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

const Listing = mongoose.model("Listing", listingSchema);

export default Listing;
