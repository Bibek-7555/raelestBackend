import mongoose, {Schema} from 'mongoose'
import { User } from './user.model.js'
import { Post } from './post.model.js'
import {ApiError} from "../utility/ApiError.js"
import {ApiResponse} from "../utility/ApiResponse.js"

const savedPostSchema = new Schema(
    {
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        postID: {
            type: Schema.Types.ObjectId,
            ref: "Post"
        }
    },
    {
    timestamps: true
    }
)

savedPostSchema.index({userID: 1, postID: 1},{unique: true})

savedPostSchema.pre("save", async function(next) {
    try {
        const post = await Post.findById(this.postID)
        if(post.postOwner.equals(this.userID)) {
            throw new Error("Can't save your own post");
        }
        next()
    } catch (error) {
        console.log("Error is: ",error)
        next(error)
    }
})

export const Saved = mongoose.model("Saved", savedPostSchema)