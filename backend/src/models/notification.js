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

NotificationSchema.methods.sendNotification = async (prev) => {

    return notification = await Notification.create({
        senderId: prev.user_id,
        sendername: prev.username,
        receiverId: prev.tosenduser_id,
        message: `${prev.username} sent you an invitation`,
        type: "Invitation",
        isRead: prev.isRead
    })
}


module.exports = mongoose.model("Notification", NotificationSchema)