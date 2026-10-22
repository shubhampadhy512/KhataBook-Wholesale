const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
    {
        storemanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        merchantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: ["Purchase", "Payment"],
            required: true
        },

        items: [
            {
                name: {
                    type: String,
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },
                unit: {
                    type: String,
                    required: true
                },
                price: {
                    type: Number,
                    required: true,
                    min: 0
                }
            }
        ],

        amount: {
            type: Number,
            required: true,
            min: 0
        },
        duedate:{
            type:Date,
            required:true
        },
        description: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Transaction", TransactionSchema);