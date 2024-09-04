import { asyncHandler } from "../utility/asyncHandler.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utility/cloudinary.js"
import { ApiError } from "../utility/ApiError.js"
import {ApiResponse} from "../utility/ApiResponse.js"
import { verifyJwt } from "../middlewares/authorization.js"
import fs from 'fs'
import jwt from 'jsonwebtoken'

const generateAccessTokenAndRefreshToken = async (user) => {
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    return {accessToken, refreshToken}
}
const unlinkFile = (localFilePath) => {
    if(localFilePath) {
        fs.unlinkSync(localFilePath)
        console.log("Local file removed")
    }
}
const registerUser = asyncHandler( async(req, res) => {
    const {username, email, password } = req.body
    const localfilepath = req.file?.path

    try {
        if(!email.includes("@")) {
            unlinkFile(localfilepath)
            throw new ApiError(400, "Don't seem like an email")
        }
    
        const existedUser = await User.findOne({
            $or: [{username}, {email}]
        })
    
        if(existedUser) {
            unlinkFile(localfilepath)
            throw new ApiError(400, "User already exists")
        }
        if([username, email, password].some((field) => field.trim() === "")) {
            unlinkFile(localfilepath)
            throw new ApiError(400, "All fields are required")
        }
    
        let avatarURL
        if (localfilepath) {
         const avatarUpload = await uploadOnCloudinary(localfilepath)
         avatarURL = avatarUpload.url
        }
       
       const user = await User.create({
        username,
        email,
        password,
        avatar: avatarURL || ""
       })
    
       const isUserCreated = await User.findById(user._id).select("-password -refreshToken")
    
       if(!isUserCreated) {
        throw new ApiError(500, "Something went wrong while registering the user")
       }
    
       return res.status(201)
       .json(new ApiResponse(200, isUserCreated, "User registered successfully"))
    } catch (error) {
        console.log(error)
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        return res.status(500).json({ message: "Failed to create user" });
    }
})

const loginUser = asyncHandler(async(req, res) => {
    try {
        const {username, email, password} = req.body
    
        if(!(username || email)) {
            throw new ApiError(404, "Atleast one from Username or Email is required")
        }
    
        if(!password) {
            throw new ApiError(404, "Password is required")
        }
    
        const user = await User.findOne(
            {
                $or: [{username: username}, {email: email}]
            }
        )
    
        if(!user) {
            throw new ApiError(400, "User not found")
        }
    
        const isPasswordValid = await user.isPasswordCorrect(password)
    
        if(!isPasswordValid) {
            throw new ApiError(404, "Incorrect Password")
        }
    
        const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user)
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
    
        const demoUser = user.toObject();
        delete demoUser.password
        delete demoUser.refreshToken
    
        const accessTokenoptions = {
            httpOnly: true,
            secure: true,
            maxAge: 3*60*60*1000
        }
        const refreshTokenoptions = {
            httpOnly: true,
            secure: true,
            maxAge: 5*60*60*1000
        }
    
        return res.status(200)
        .cookie("accessToken", accessToken, accessTokenoptions)
        .cookie("refreshToken", refreshToken, refreshTokenoptions)
        .json(
            new ApiResponse(
                200,
                demoUser,
                "User logged in successfully"
            )
        )
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        return res.status(500).json({ message: "Failed to create Login " });
    }

})

const refreshAllTokens = asyncHandler(async(req, res) => {
    const userId = req.user?._id
    try {
        const user = await User.findById(userId)
        if(!user) {
            throw new ApiError(404, "User not found")
        }
        const atoken = req.cookies.accessToken;
        const rtoken = req.cookies.refreshToken;
        let accessToken, refreshToken;
        if(atoken) {
            const decodedatoken = jwt.decode(atoken, process.env.ACCESS_TOKEN_SECRET)
            if(decodedatoken.exp*1000 < Date.now() + 5*60*1000) {
                ({accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user))
                user.refreshToken = refreshToken
                await user.save({validateBeforeSave: false})
                const accessTokenoptions = {
                    httpOnly: true,
                    secure: true,
                    maxAge: 3*60*60*1000
                }
                const refreshTokenoptions = {
                    httpOnly: true,
                    secure: true,
                    maxAge: 5*60*60*1000
                }
                return res.status(200)
                .cookie("accessToken", accessToken, accessTokenoptions)
                .cookie("refreshToken", refreshToken, refreshTokenoptions)
                .json(new ApiResponse(200, user, "Cookies Successfully refreshed"))
            } else {
                return res.status(200).json(new ApiResponse(200, user, "Cookies are still valid"));
            }
        } else if(rtoken) {
            const decodedrtoken = jwt.decode(rtoken, process.env.REFRESH_TOKEN_SECRET)
            if(decodedrtoken.exp < Date.now()) {
                ({accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user))
                user.refreshToken = refreshToken
                await user.save({validateBeforeSave: false})
                const accessTokenoptions = {
                    httpOnly: true,
                    secure: true,
                    maxAge: 3*60*60*1000
                }
                const refreshTokenoptions = {
                    httpOnly: true,
                    secure: true,
                    maxAge: 5*60*60*1000
                }
                return res.status(200)
                .cookie("accessToken", accessToken, accessTokenoptions)
                .cookie("refreshToken", refreshToken, refreshTokenoptions)
                .json(new ApiResponse(200, user, "Cookies Successfully refreshed"))
            }
        } else {
            throw new ApiError(400, "No tokens or invalid tokens")
        }
    } catch (error) {
        console.log(error)
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(new ApiResponse(error.message, null, "Failed to generate tokens "));
        }
        return res.status(401).json(new ApiResponse(error.message, null, "Failed to generate tokens "));
    }
})

const logoutUser = asyncHandler(async(req,res) => {
    try {
        const userId = req.user?._id
        if(!userId) {
            throw new ApiError(404, "User not logged so can't logout")
        }
        const user = User.findByIdAndUpdate(
            userId,
            {
                $unset: {
                    refreshToken: 1
                }
            },
            {
                new: true
            }
    
        )
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Logged out succssfully"))
    
    } catch (error) {
        console.log("From logout error", error)
        if(error instanceof ApiError) {
            return res.status(error.statusCode).json({message: error.message || "Failed to logOut"})
        }
    }
    
})



export {
    registerUser,
    loginUser,
    refreshAllTokens,
    logoutUser
}