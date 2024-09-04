import mongoose, {Schema, model} from 'mongoose'


const messageSchema = new Schema(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true
        },
        chatRoom: {
            type: Schema.Types.ObjectId,
            ref: 'ChatRooom',
            required: true
        }
    },
    {
        timestamps: true
    }
)

export const Message = mongoose.model("Message", messageSchema)