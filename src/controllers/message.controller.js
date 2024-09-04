import mongoose, { Schema } from "mongoose";
import { ChatRoom } from "../models/chatRoom.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../utility/ApiError.js";
import { asyncHandler } from "../utility/asyncHandler.js";
import { ApiResponse } from "../utility/ApiResponse.js";



const addMessage = asyncHandler(async(req, res) => {
    const userID = req.user._id
    const chatID = req.params.chatID
    const content = req.body.content
    console.log(userID, chatID, content)
    try {
        const chat = await ChatRoom.findOne(
            {
                _id: chatID,
                participants: {$in: [userID]}
            }
        )
        if(!chat) {
            throw new ApiError(400).message("Can't find the chatRoom")
        }
        const message = await Message.create({
            sender: userID,
            content: content,
            chatRoom: chat._id
        })
        const updateSeenBy = await ChatRoom.findByIdAndUpdate(chat._id , {
            seenBy: [userID],
            lastMessage: message._id,
            $push: {messages: message._id}
        }, {
            new: true
        }).populate('lastMessage')

        
        const updated = await ChatRoom.aggregate([
            {$match: {_id: updateSeenBy._id}},

            {
                $lookup: {
                    from: 'messages',
                    localField: 'lastMessage',
                    foreignField: '_id',
                    as: 'lastMessage'
                }
            },
            {$unwind: '$lastMessage'},
            {
                $lookup: {
                    from: 'users',
                    localField: 'participants',
                    foreignField: '_id',
                    as: "senderInfo"
                }
            },
            // {$unwind: '$senderInfo'},
            {
                $lookup: {
                    from: 'messages',
                    localField: 'messages',
                    foreignField: '_id',
                    as: 'Message'
                }
            },
            {
                $project: {
                    'lastMessage._id' : 1,
                    'lastMessage.content': 1,
                    'senderInfo.username': 1,
                    'Message.content': 1
                }
            }
        ])
        res.status(200).json(new ApiResponse(200, message, "Successfull"))
    } catch (error) {
        console.log(error)
        res.status(200).json({message: "Failed to add message"})
    }
})

export { addMessage }