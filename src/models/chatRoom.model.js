import mongoose, {Schema} from 'mongoose'



const chatRoomSchema = new Schema(
    {
        participants: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }],
        messages: [{
            type: Schema.Types.ObjectId,
            ref: "Message"
        }],
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message"
        },
        seenBy: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }]
    }, 
    {
    timestamps: true
    }
)

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema)