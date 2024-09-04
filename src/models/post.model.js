import mongoose, {model, Schema} from 'mongoose'
import { User } from './user.model.js'
import { Saved } from './savedPost.model.js'


const postSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        postImages: {
            type: [String],
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        bedroom: {
            type: Number,
        },
        bathroom: {
            type: Number
        },
        latitude: {
            type: String,
            required: true
        },
        longitude: {
            type: String,
            required: true
        },
        city: {
            type: String
        },
        type:{
            type: String,
            enum: ["buy", "rent"],
            required: true
        },
        property: {
            type: String,
            enum: ["apartment", "house", "condo", "land"],
        },
        postOwner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        postDetail: {
            type: Schema.Types.ObjectId,
            ref: "PostDetail"
        },
        savedPost:[
            {
            type: Schema.Types.ObjectId,
            ref: "Saved"
            }
        ]
    },
    {
        timestamps: true
    }
)

export const Post = mongoose.model("Post", postSchema)