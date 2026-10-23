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
    paymentType: {
        type: String,
        enum: ['Online', 'Cash'],
        required: true
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
    }
}, { timestamps: true }
)


module.exports = mongoose.model("Payment", PaymentSchema)