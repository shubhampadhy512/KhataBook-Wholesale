
const mongoose = require("mongoose")

const productSchema = new mongoose.Schema(
    {
        storemanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        productname: {
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
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);


module.exports = mongoose.model("Product", productSchema);
