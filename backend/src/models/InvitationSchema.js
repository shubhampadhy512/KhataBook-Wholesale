const mongoose = require("mongoose")

const InvitationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tosenduser_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Accept', 'Decline'],
        default: 'Pending'
    },
    connection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Connection',
        default: null
    },
    expiresDate: {
        type: Date,
        required: true
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
    }
}, { timestampes: true }
)
const Invitation = mongoose.model("Invitation", InvitationSchema);
const Connection = mongoose.model("Connection", connectionSchema);

module.exports = { Invitation, Connection };