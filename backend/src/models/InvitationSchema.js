const mongoose = require("mongoose")

const InvitationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receive_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Decline'],
        default: "Pending",
        required: true
    },
    connection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Connection',
        default: null
    }
}, { timestampes: true }
)

const connectionSchema = new mongoose.Schema({
    storemanID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    totalamount: {
        type: Number,
        default: 0
    }, totalpaid: {
        type: Number,
        default: 0
    }
}, { timestampes: true }
)
const Invitation = mongoose.model("Invitation", InvitationSchema);
const Connection = mongoose.model("Connection", connectionSchema);

module.exports = { Invitation, Connection };