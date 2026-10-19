const asyncHandler = require("../utils/asyncHandler.js");
const { Invitation, Connection } = require("../models/InvitationSchema.js");
const Notification = require("../models/notification.js");

const InvitationSend = asyncHandler(async (req, res) => {
    const user_id = req.user?._id;
    const username = req.user?.username;
    const receive_id = req.body._id;
    const recipientUsername = req.body.username;


    if (!user_id || !receive_id || !recipientUsername || !username) {
        return res.status(400).json({
            message: "Required fields are missing"
        });
    }

    const already = await Invitation.findOne({
        userId: user_id,
        receive_id: receive_id,
        // $or:[{status:'Pending'},{status:'Pending'}]
    });

    if (already) {
        return res.status(409).json({
            message: 'You have already sent an invitation to this person'
        });
    }

    if (user_id.toString() === receive_id.toString()) {
        return res.status(400).json({
            message: "You cannot send an invitation to yourself"
        });
    }

    const invitation = await Invitation.create({
        userId: user_id,
        receive_id,
        status: 'Pending',
        expiresDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await Notification.create({
        senderId: user_id,
        sendername: username,
        receiverId: receive_id,
        message: `${username} sent you an invitation`,
        type: "Invitation"
    });

    // const type = 'invitation'
    // const message =  `${username} sent you an ${type}`
    // const notificaiton = Notification.sendNotification(user_id,username,receive_id,message,type)

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

    // console.log(req.user)
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

    // mark that all normal notification is seen

    const temp = await Notification.findOneAndUpdate(
        {
            $and: [{ receiverId: _id }, { type: 'Normal' }]
        }, {
        $set: {
            isRead: true
        }
    },
        { returnDocument: 'after' }
    )
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
    console.log(seenmessage.senderId, _id)
    // Update the invitation
    const invitation = await Invitation.findOneAndUpdate({
        $and: [
            { userId: seenmessage.senderId }, { receive_id: _id }
        ]
    }, { $set: { status } },
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
        await Connection.create({
            storemanID: invitation.userId,
            merchantId: invitation.receive_id
        });
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

    const temp = await Notification.updateMany(
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