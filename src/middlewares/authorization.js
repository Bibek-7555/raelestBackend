import { asyncHandler } from "../utility/asyncHandler.js"
import jwt from 'jsonwebtoken'
import { User } from "../models/user.model.js"
import { ApiError } from "../utility/ApiError.js"

export const verifyJwt = asyncHandler (async(req, res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.refreshToken
    
        if(!token) {
            console.log("Walla habibi")
            throw new ApiError(401, "Unauthorized Request")
        }
    
        const decodedToken = jwt.decode(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
    
        if(!user) {
            throw new ApiError(401, "Invalid Token")
        }
        console.log("In authorization and the user is: ", user);
    
        req.user = user
        console.log("The user in request is: ", req.user)
        next();
    } catch (error) {
        res.status(error.statusCode || 401)
        .json({message: "pata nahi kya hua"})
    }
})