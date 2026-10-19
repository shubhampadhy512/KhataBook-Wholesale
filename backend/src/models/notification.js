const mongoose = require("mongoose")

const NotificationSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sendername: {
        type: String,
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String
    },
    type: {
        type: String,
        enum: ['Payment', 'Invitation', 'Normal']
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true }
)

NotificationSchema.statics.sendNotification = async function ({ senderId, sendername, receiverId, message, type, isRead = false }) {
    return this.create({ senderId, sendername, receiverId, message, type, isRead });
};

module.exports = mongoose.model("Notification", NotificationSchema)