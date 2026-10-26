const mongoose = require("mongoose")


const PaymentSchema = new mongoose.Schema({
    storemanId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    transactionId: {
        type: String,
        trim: true,
        default: null
    },
    paymentType: {
        type: String,
        enum: ['UPI', 'Cash'],
        required: true,
        default: 'Cash'
    },
    status: {
        type: String,
        enum: ['Pending', 'Approve', 'Reject'],
        default: 'Pending'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    notes: {
        type: String,
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId
    }
}, { timestamps: true }
)


module.exports = mongoose.model("Payment", PaymentSchema)