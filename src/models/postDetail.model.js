import mongoose, {Schema} from "mongoose";



const postDetailSchema = new Schema(
    {
        description: {
            type: String,
            //required: true
        },
        utilities: {
            type: String,
            required: true
        },
        petPolicy: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        propertyFees: {
            type: String
        },
        school: {
            type: Number
        },
        bus: {
            type: Number
        },
        restaurant: {
            type: Number
        },
        detailOfPost: {
            type: Schema.Types.ObjectId,
            ref: "Post"
        }
    },
    {timestamps: true})


    export const PostDetail = mongoose.model("PostDetail", postDetailSchema)