const asyncHandler = require("../utils/asyncHandler.js");
const { Invitation, Connection } = require("../models/InvitationSchema.js");
const Notification = require("../models/notification.js");


const InvitationSend = asyncHandler(async (req, res) => {
    const user_id = req.user?._id;
    const username = req.user?.username;
    const receive_id = req.body._id;
    const recipientUsername = req.body.username;

    if (!user_id || !receive_id || !recipientUsername || !username) {
        return res.status(400).json({ message: "Invitation cant send" });
    }

    // cannot invite yourself
    if (user_id.toString() === receive_id.toString()) {
        return res.status(400).json({
            message: "You cannot send invitation to your self",
        });
    }

    // check both directions: me -> them, and them -> me
    const existing = await Invitation.findOne({
        $or: [
            { userId: user_id, receive_id: receive_id },
            { userId: receive_id, receive_id: user_id },
        ],
    }).sort({ updatedAt: -1 });

    let invitation;

    if (!existing) {
        invitation = await Invitation.create({
            userId: user_id,
            receive_id: receive_id,
            status: 'Pending',
        });
    } else if (!existing.status || existing.status === 'Decline') {
        existing.userId = user_id;
        existing.receive_id = receive_id;
        existing.status = 'Pending';
        invitation = await existing.save();
    } else {
        const iSentIt = existing.userId.toString() === user_id.toString();
        const message =
            existing.status === 'Approved'
                ? 'That is already in your list'
                : iSentIt
                    ? 'Invitation already sent'
                    : 'This user has already sent you an invitation';
        return res.status(409).json({ message, invitation: existing });
    }

    // send the notification after the invitation is saved
    const notified = await Notification.sendNotification({
        senderId: user_id,
        sendername: username,
        receiverId: receive_id,
        message: `${username} sent you an invitation`,
        type: "Invitation",
        isRead: false,
    });

    if (!notified) {
        return res.status(500).json({
            message: "Invitation saved, but the notification could not be sent",
            invitation,
        });
    }

    return res.status(201).json({
        message: `Invitation sent to ${recipientUsername}`,
        invitation,
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
        isRead: false
    }).sort({ createdAt: -1 });

    return res.status(200).json({
        info: notifications,
        message: "All unread notifications"
    });
});

const UpdateMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { _id, username } = req.user;

    // Find the notification and verify the recipient
    const seenmessage = await Notification.findOne({
        _id: id,
        receiverId: _id,
        type: 'Invitation'
    });
    if (!seenmessage) {
        return res.status(404).json({
            message: 'Invalid notification'
        });
    }

    const checkconnection = await Connection.findOne({
        merchantId: _id
    });

    if (checkconnection) {
        await Invitation.findOneAndUpdate(
            {
                userId: seenmessage.senderId,
                receive_id: _id
            },
            {
                $set: { status: '' }
            }
        );

        await Notification.findByIdAndUpdate(id, {
            $set: { isRead: true }
        });

        return res.status(409).json({
            message: 'You already have a storeman'
        });
    }

    // Update the invitation
    const newstatus = status === 'Decline' ? "" : status
    const invitation = await Invitation.findOneAndUpdate({
        $and: [
            { userId: seenmessage.senderId }, { receive_id: _id }
        ]
    }, { $set: { status: newstatus } },
        { returnDocument: 'after' }
    );

    if (!invitation) {
        return res.status(404).json({
            message: 'Invitation not found'
        });
    }

    // Mark notification as read
    await Notification.findByIdAndUpdate(id, {
        $set: { isRead: true }
    },
        { returnDocument: 'after' }
    );

    // Create a connection only when approved
    if (status === 'Approved') {
        const connection = await Connection.create({
            storemanID: invitation.userId,
            merchantId: invitation.receive_id
        });
        invitation.connection = connection._id
        invitation.save()
    }

    // Notify the original invitation sender
    await Notification.create({
        senderId: _id,
        sendername: username,
        receiverId: seenmessage.senderId,
        message: `${username} ${status} the invitation`,
        type: 'Normal',
        isRead: false
    });

    return res.status(200).json({
        message: `Invitation ${status} successfully`,
        status: status
    });
});

const NormalMessageSeen = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    await Notification.updateMany(
        {
            receiverId: _id,
            type: 'Normal',
            isRead: false
        },
        {
            $set: {
                isRead: true
            }
        }
    );

    const modifiednotification = await Notification.find({
        receiverId: _id,
        isRead: false
    })

    return res.status(200).json({
        message: 'Normal notifications marked as read',
        modified: modifiednotification
    });
});

module.exports = { InvitationSend, Listofmessage, UpdateMessage, NormalMessageSeen };