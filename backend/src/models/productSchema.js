
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        storemanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        category: {
            type: String,
            required: true,
            trim: true,
        },

        unit: {
            type: String,
            required: true,
            enum: ["kg", "litre", "packet", "bag", "piece", "box"],
            default: "kg",
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        emoji: {
            type: String,
            default: "📦",
            trim: true,
        },

        imageUrl: {
            type: String,
            default: "",
            trim: true,
        },

        imagePublicId: {
            type: String,
            default: "",
            trim: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);


export const Product = mongoose.model("Product", productSchema);
