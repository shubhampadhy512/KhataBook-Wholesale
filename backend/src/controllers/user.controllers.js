const asyncHandler = require("../utils/asyncHandler.js")
const User = require("../models/user.model.js")
const { sendOtp } = require("../utils/sendotp.js");
const OtpSchema = require("../models/OtpSchema.js");

const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = User.findById(userId);
        const accessToken = User.generateAccessToken()
        const refreshToken = User.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (err) {
        return {
            port: 500,
            message: "Something gone wrong during creating access and referesh Token"
        }
    }
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
        console.log("User already exist")
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

    return res.status(201).json({
        message: "Check your E-Mail"
    })
})

const registerVerification = asyncHandler(async (req, res, next) => {
    // check the otp verification 
    const { username, email, phonenumber, password, otp, role } = req.body

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
        username,
        email,
        phonenumber,
        role,
        password
    })

    const newuser = await User.findById(user._id).select("-password -refreshToken")

    return res.status(201).json({
        message: "User registered successfully",
        user: {
            _id: newuser._id,
            username: newuser.username,
            email: newuser.email,
            role: role,
            phonenumber: newuser.phonenumber
        }

    })

})

const loginUser = asyncHandler(async (req, res, next) => {
    // req to get data 
    console.log("Backend start")
    const { username, email, password, role } = req.body

    console.log({ username, email, password, role })

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

    const loggedUser = await User.findById(finduser._id).select("-password -refreshToken")

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json({
            port: 200,
            user: loggedUser, refreshToken, accessToken,
            message: "User logged in successfully"
        })
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findOneAndUpdate(
        req.body._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json({
            message: "User Logged Out!!"
        })

})

const refreshAccesstoken = asyncHandler(async (req, res, next) => {

    const token = req.cookie.refreshToken || req.body.refreshToken
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
            secure: true
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

module.exports = { registerUser, registerVerification, loginUser, logoutUser, refreshAccesstoken }