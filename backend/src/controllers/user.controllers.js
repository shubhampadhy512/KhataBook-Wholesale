const asyncHandler = require("../utils/asyncHandler.js")
const User = require("../models/user.model.js")
const { sendOtp } = require("../utils/sendotp.js");
const OtpSchema = require("../models/OtpSchema.js");
const { Invitation, Connection } = require("../models/InvitationSchema.js")

const generateAccessandRefreshToken = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found while generating tokens");
    }

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
}

const registerUser = asyncHandler(async (req, res, next) => {
    // Get all field which required are provided by user 

    const { username, email } = req.body

    if ([username, email].some(data => !data || data?.trim() === "")) {
        return res.status(400).json({
            message: "All fields are required"
        })
    }

    // Check that user which registrating is already exist or not

    const userExist = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (userExist) {
        return res.status(409).json({
            message: "User already exist"
        })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const sendotp = await sendOtp(email, username, otp);

    if (sendotp.accepted.length === 0) {
        return res.status(502).json({
            message: "Could not send OTP email"
        });
    }

    const createotp = await OtpSchema.create({
        email: email,
        otpHash: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    })

    if (!createotp) {
        return res.status(500).json({
            message: "Otp not send Retry"
        })
    }
    return res.status(201).json({
        message: "Check your E-Mail"
    })
})
const resendOtp = asyncHandler(async (req, res) => {
    const { email, username } = req.body

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const sendotp = await sendOtp(email, username, otp);

    if (sendotp.accepted.length === 0) {
        return res.status(502).json({
            message: "Could not send OTP email"
        });
    }

    const otpRecord = await OtpSchema.findOne({ email });

    if (!otpRecord) {
        return res.status(404).json({
            message: "OTP record not found"
        });
    }

    otpRecord.otpHash = otp;
    otpRecord.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    console.log(otp)
    await otpRecord.save();

    if (!otpRecord) {
        return res.status(500).json({
            message: "Otp not send Retry"
        })
    }
    return res.status(201).json({
        message: "Check your E-Mail"
    })
})
const registerVerification = asyncHandler(async (req, res, next) => {
    // check the otp verification 
    const { username, email, phonenumber, password, addresses, otp, role } = req.body

    const finalUsername =
        role === "storeman" ? `${username} Store` : username;

    if (!otp) {
        return res.status(400).json({
            message: "Fill up all box"
        })
    }

    //check time 
    const record = await OtpSchema.findOne({ email: email })
    if (!record || record.expiresAt < new Date()) {
        if (record) await OtpSchema.deleteOne({ _id: record._id });
        return res.status(400).json({
            message: "OTP expired. Please request a new one."
        });
    }
    //check attempts
    if (record.attempts <= 1) {
        await OtpSchema.deleteOne({ _id: record._id });
        return res.status(429).json({
            message: "Too many attempt"
        })
    }

    //check otp
    const matchOtp = await record.isOtpMatch(otp)

    if (!matchOtp) {
        record.attempts -= 1;
        await record.save()
        return res.status(405).json({
            messsage: "Incorrect Otp"
        })
    }


    // All test cases is verfied then create new user in mongo db

    const user = await User.create({
        username: finalUsername,
        email,
        phonenumber,
        role,
        addresses,
        password
    })

    const newuser = await User.findById(user._id).select("-password -refreshToken")

    return res.status(201).json({
        message: "User registered successfully",
        user: {
            _id: newuser._id,
            username: newuser.username,
            email: newuser.email,
            addresses: newuser.addresses,
            role: role,
            phonenumber: newuser.phonenumber
        }

    })

})

const loginUser = asyncHandler(async (req, res, next) => {
    // req to get data 
    const { username, email, password, role } = req.body

    if (!username && !email) {
        return res.status(400).json({
            message: "Username or Email_Id is Required"
        })
    }


    // to check the user exist or not
    const finduser = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (!finduser) {
        return res.status(404).json({
            message: "Invalid Username or Email_Id"
        })
    }

    if (finduser.role != role) {
        return res.status(404).json({
            message: `You're not registered as a ${role[0].toUpperCase()}${role.slice(1)}`
        })
    }
    //check the password valid or not 

    const isPassword = await finduser.isPasswordMatch(password);

    if (!isPassword) {
        return res.status(401).json({
            message: "Invalid Password"
        })
    }

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(finduser._id)

    const loggedUser = await User.findById(finduser._id).select("-password -refreshToken -email -role")

    const option = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res.status(200).cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json({
            port: 200,
            user: loggedUser,
            message: "User logged in successfully"
        })
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findOneAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        { returnDocument: 'after' }
    )

    const option = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res.status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json({
            message: "User Logged Out!!"
        })

})

const refreshAccesstoken = asyncHandler(async (req, res, next) => {

    const token = req.cookies?.refreshToken || req.body.refreshToken
    if (!token) {
        return res.status(401).json({
            message: 'Unauthorized refreshtoken'
        })
    }

    try {
        const decode = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decode?._id)

        if (!user) {
            return res.status(401).json({
                message: "Invalid refresh token"
            })
        }

        if (token !== user?.refreshToken) {
            return res.status(401).json({
                message: "Rfresh Token is expriy"
            })
        }

        const option = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        }

        const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id)

        return res.status(200)
            .cookie("accessToken", accessToken, option)
            .cookie("refreshToken", refreshToken, option)
            .json({
                port: 200,
                user: refreshToken, accessToken,
                message: "User logged in successfully"
            })
    } catch (error) {
        return res.status(401).json({
            message: 'New refresh token is not generate'
        })
    }
})

const Changepass_validateEmail = asyncHandler(async (req, res) => {

    const { email, role } = req.body

    if (!email || !role) {
        return res.status(400).json({
            message: 'All field require'
        })
    }

    const user = await User.findOne({ email: email })

    if (!user) {
        return res.status(400).json({
            message: 'User not found in this email'
        })
    }

    if (role !== user.role) {
        return res.status(401).json({
            message: `This Email_Id is not register for this ${role}`
        })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const sendotp = await sendOtp(email, user.username, otp);

    if (sendotp.accepted.length === 0) {
        return res.status(502).json({
            message: "Could not send OTP email"
        });
    }

    const createotp = await OtpSchema.create({
        email: email,
        otpHash: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    })

    if (!createotp) {
        return res.status(500).json({
            message: "Otp not send Retry"
        })
    }
    return res.status(201).json({
        message: "Check your E-Mail"
    })


})

const VerifyOtp = asyncHandler(async (req, res) => {
    const { otp, email } = req.body

    if (!otp) {
        return res.status(400).json({
            message: "Fill up all box"
        })
    }

    //check time 
    const record = await OtpSchema.findOne({ email: email })
    if (!record || record.expiresAt < new Date()) {
        if (record) await OtpSchema.deleteOne({ _id: record._id });
        return res.status(400).json({
            message: "OTP expired. Please request a new one."
        });
    }
    //check attempts
    if (record.attempts <= 1) {
        await OtpSchema.deleteOne({ _id: record._id });
        return res.status(429).json({
            message: "Too many attempt"
        })
    }

    //check otp
    const matchOtp = await record.isOtpMatch(otp)

    if (!matchOtp) {
        record.attempts -= 1;
        await record.save()
        return res.status(405).json({
            messsage: "Incorrect Otp"
        })
    }

    return res.status(200).json({
        message: "Otp verified"
    })

})

const ResetPassword = asyncHandler(async (req, res) => {
    const { email, newPassword } = req.body

    if (!email || !newPassword) {
        return res.status(400).json({
            message: "Email and new password are required"
        });
    }

    const user = await User.findOne({ email: email })


    if (!user) {
        return res.status(401).json({
            message: 'User not found'
        })
    }

    const checkoldpassword = await user.isPasswordMatch(newPassword)

    if (checkoldpassword) {
        return res.status(401).json({
            message: "New password is same to Old password"
        })
    }


    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200).json({
        message: "Changed your password Successfully"
    })
})

const FindStoremanOrMerchant = asyncHandler(async (req, res, next) => {

    const { searched } = req.query
    if (!searched) {
        return res.status(400).json({
            meassage: "Not found anything"
        })
    }
    const regx = new RegExp(
        searched.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
    );
    const { role } = req.user
    const oppositeRole = role === "merchant" ? "storeman" : "merchant";
    const data = await User.find({
        role: oppositeRole,
        username: regx
    }).sort({ username: 1 }).limit(5).select("-password -refreshToken -email -phonenumber")

    if (data.length === 0) {
        return res.status(400).json({
            meassage: "Not found anything"
        })
    }

    const result = await Promise.all(
        data.map(async (user) => {
            const invitation = await Invitation.findOne({
                userId: req.user._id,
                receive_id: user._id
            })
                .sort({ updatedAt: -1 })
                .select("status");

            return {
                ...user.toObject(),
                status: invitation?.status || ""
            };
        })
    );

    return res.status(201).json({
        message: 'This is search based on role',
        info: result
    })
})


const getMerchantdetails = asyncHandler(async (req, res) => {
    const { _id } = req.user

    if (!_id) {
        return res.status(400).json({
            message: 'User not found'
        })
    }

    const merchants = await Connection.find({
        storemanID: _id
    })
    if (!merchants) {
        return res.status(401).json({
            message: 'There is not data'
        })
    }

    const merchantsdetails = await Promise.all(
        merchants.map(async (user) => {
            const invitation = await User.findOne({
                _id: user.merchantId
            })
                .sort({ updatedAt: -1 })
                .select("username phonenumber");

            return {
                ...user.toObject(),
                username: invitation?.username || "",
                phonenumber: invitation?.phonenumber || ""
            };
        })
    );
    return res.status(200).json({
        message: 'This details',
        body: merchantsdetails
    })
})

const getUserdetails = asyncHandler(async (req, res) => {
    const { _id } = req.user._id

    if (!_id) {
        return res.status(400).json({
            message: 'User not found'
        })
    }
    const user = await User.findById(_id).select("-phonenumber -addresses -password -refreshToken")
    console.log(user)
    return res.status(200).json({
        message: 'This details',
        body: user
    })
})


module.exports = {
    registerUser,
    registerVerification,
    loginUser,
    logoutUser,
    refreshAccesstoken,
    FindStoremanOrMerchant,
    resendOtp,
    ResetPassword,
    Changepass_validateEmail,
    VerifyOtp,
    getMerchantdetails,
    getUserdetails
}