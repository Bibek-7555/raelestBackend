import { asyncHandler } from "../utility/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";
import mongoose, { Schema } from "mongoose";
import { uploadOnCloudinary } from "../utility/cloudinary.js";
import { Post } from "../models/post.model.js";
import { Saved } from "../models/savedPost.model.js";
import { ChatRoom } from "../models/chatRoom.model.js";



const getAllUsers = asyncHandler( async (req, res) => {
    try {
        const users = await User.find({}, 'username email avatar')
        if(!users) {
            throw new ApiError(400, "Can't find users")
        }
        res.status(200)
        .json(new ApiResponse(
            200,
            users,
            "Users fetched successfully"
        ))
    } catch (error) {
        console.log(error)
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        return res.status(500).json({ message: "Failed to create user" });
    }
})



const getUser = asyncHandler( async( req, res) => {
    const userId = req.user._id
    console.log("thheee iddd is: ", userId)
    if(!userId) {
        throw new ApiError(404, "No ID in params")
    }
    try {
        const user = await User.findById(userId).select("-password -refeshToken")
        if(!user) {
            throw new ApiError(404, "There is no such user in database")
        }
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "User found as per Id"
        ))
    } catch (error) {
        if(error instanceof ApiError) {
            return res.status(error.statusCode).json({message: error.message})
        }
        else if (error.name === 'CastError' && error.kind === 'ObjectId') {
            // Handle invalid ObjectId error
            console.log(error)
            return res.status(400).json({ message: `Invalid ID formatted ${error.message}`  });
        } else {
            return res.status(400).json({message: "Can't get user"})
        }
    }
})


const updateUser = asyncHandler( async(req, res) => {
    const userId= (req.user?._id).toString()
    const id = req.params.id

    if (id !== userId) {
        throw new ApiError(403, "Sorry, Not Authorized")
    }
    // const {username, email, password} = req.body
    // let updatedPassword
    const updateFields = {
        username: req.body.username,
        email: req.body.email
    }

    let updatedPassword = req.body.password

    if(updatedPassword) {
        updateFields.password = updatedPassword
    }

    let localFilePath = req.file?.path
    let uploadFile

    if(localFilePath) {
         uploadFile = await uploadOnCloudinary(localFilePath)
         if(uploadFile) {
            updateFields.avatar = uploadFile.secure_url
        } else {
            throw new ApiError(500, "Problem occured while uploading avatar")
        }
    }


    try {
    
            const newUser = await User.findOneAndUpdate(
                {_id: id},
                {
                    $set: updateFields
                },
                {new: true}
            ).select("-password -refreshToken")

            if(!newUser) {
                throw new ApiError(500, "Couldn't Update")
            }

            console.log(newUser)
    
        return res
        .status(200)
        .json(new ApiResponse(201, newUser, "User updated successfully"))
    } catch (error) {
        if(error instanceof ApiError) {
            return res.status(error.statusCode).json({message: error.message })
        }

        return res.status(500).json({message: "Failed to update user"})
    }
})

const savePost = asyncHandler( async(req,res) => {
    console.log("req.body", req.body)
    console.log("Invalid ID format")
    let postID
    try {
        postID = new mongoose.Types.ObjectId(req.body.postID);
        console.log("postID", postID);
    } catch (error) {
        console.log("Error converting postID:", error);
        return res.status(400).json(new ApiResponse(400, {}, "Invalid postID format"));
    }
    console.log("postID", postID)
    const userID = req.user?._id
    console.log("userID",userID)

    try {
        console.log("kam chall raha he")
        if (!userID || !postID) {
            console.log("Missing")
            throw new Error("userID or postID is undefined");
        }

        const savedPost = await Saved.findOne({userID: userID, postID: postID})
        console.log(savedPost)
        
        if(savedPost) {
            console.log("Post was saved")
            await savedPost.deleteOne({_id: savedPost._id})
            console.log("Deleted saved post")
            res.status(200).json(new ApiResponse(200, {}, "Post removed from saved list"))
        } else {
            console.log("In the else block")
            const postSaved = await Saved.create({
                userID: userID,
                postID: postID
            })
            if(!postSaved) {
                console.log("Save ho hi nahi paya")
                throw new ApiError(400, "Can't save post")
            }
            console.log("Itsd coming")
            res.status(200).json(new ApiResponse(200, postSaved, "Post saved successfully"))
        }
    } catch (error) {
        console.log(error)
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({message: error.message})
        }
        res.status(500).json({message: error.message || "Can't save or unsave post"})
    }
})

const profilePosts = asyncHandler( async(req,res) => {
    console.log("hello I am Bibek kkcegklgf c ru; tuk ghulgt hgitrhegkr trhj gui4gh54lk h34h g lk2rhgjerkj g34")
    const userID = req.user._id
    console.log("In profile posts and User id is: ", userID)
    let posts = {}
    try {
        const userPosts = await Post.find({postOwner: userID})
        console.log("The userposts are: ", userPosts)
        if(userPosts) {
            posts.userPosts = userPosts
        }
        const savedPosts = await Saved.aggregate([
            {$match: {userID: userID}},

            {
                $lookup: {
                    from: "posts",
                    localField: 'postID',
                    foreignField: '_id',
                    as: 'postDetails'
                }
            },
            {
                $unwind: '$postDetails'
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: ['$$ROOT', '$postDetails']
                    }
                }
            },
            {
                $project: {
                    postDetails: 0
                }
            }
        ])
        if(savedPosts) {
            console.log("mil gaya savedposts")
            console.log(savedPosts)
            posts.savedPosts = savedPosts
        }
        return res.status(200).json(new ApiResponse(200, posts, "UserPosts fetched successfully"))
    } catch (error) {
        console.log(error)
        if(error instanceof ApiError) {
            return res.status(error.statusCode)
            .json({message: error.message})
        }
        res.status(401)
        .json({message: "Failed to get Profile Posts"})
    }
})

const getNotificationNumber = asyncHandler(async(req, res)=> {
    let userID = req.user._id
    console.log("In notification and the userID is: ",userID)

    try {
        const number = await ChatRoom.countDocuments({
            participants: userID,
            seenBy: {$ne: userID}
        })
        res.status(200).json(number)
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Failed to get number"})
    }
})


const deleteUser = asyncHandler( async(req, res) => {
    const userId = req.user?._id
    try {
        const deletedUser = await User.findByIdAndDelete(userId)
        if(!deletedUser) {
            throw new ApiError(404, "Something went wrong")
        }
        console.log("Deleted user: ", deletedUser)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, null, "User Deleted Successfully"))
    } catch (error) {
        if(error instanceof ApiError) {
            return res.status(error.statusCode)
            .json({message: error.message})
        }
        res.status(401)
        .json({message: error.message || "Something went wrong"})
    }
})

export {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    profilePosts,
    getNotificationNumber,
    savePost
}