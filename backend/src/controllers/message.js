const asyncHandler = require("../utils/asyncHandler.js");
const { Invitation } = require("../models/InvitationSchema.js");
const Notification = require("../models/notification.js");

const InvitationSend = asyncHandler(async (req, res) => {
    const user_id = req.user?._id;
    const username = req.user?.username;
    const tosenduser_id = req.body._id;
    const recipientUsername = req.body.username;


    if (!user_id || !tosenduser_id || !recipientUsername || !username) {
        return res.status(400).json({
            message: "Required fields are missing"
        });
    }

    if (user_id.toString() === tosenduser_id.toString()) {
        return res.status(400).json({
            message: "You cannot send an invitation to yourself"
        });
    }
    
    const invitation = await Invitation.create({
        userId: user_id,
        tosenduser_id,
        expiresDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await Notification.create({
        senderId: user_id,
        sendername: username,
        receiverId: tosenduser_id,
        message: `${username} sent you an invitation`,
        type: "Invitation"
    });

    return res.status(201).json({
        message: `Invitation sent to ${recipientUsername}`,
        invitation
    });
});

const Listofmessage = asyncHandler(async (req, res) => {
    const user_id = req.user?._id;

    if (!user_id) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    const notifications = await Notification.find({
        receiverId: user_id,
        type: "Invitation",
        isRead: false
    }).sort({ createdAt: -1 });

    return res.status(200).json({
        info: notifications,
        message: "All unread notifications"
    });
});

module.exports = { InvitationSend, Listofmessage };