const asyncHandler = require("../utils/asyncHandler.js")
const User = require("../models/user.model.js")

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

    const { username, email, phonenumber, role, password } = req.body

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
            phonenumber: newuser.phonenumber
        }

    })
})

const loginUser = asyncHandler(async (req, res, next) => {
    // req to get data 
    const { username, email, password } = req.body

    if (!username && !email) {
        return res.status(400).json({
            message: "Username or Email_Id is Required"
        })
    }

    // check the password is correct or not 
    const finduser = await User.findOne({
        $or: [{ email }, { username }]
    })
    // to check the user exist or not 
    if (!finduser) {
        return res.status(404).json({
            message: "Invalid Username or Email_Id"
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

module.exports = { registerUser, loginUser }