import { ChatRoom } from "../models/chatRoom.model.js";
import { asyncHandler } from "../utility/asyncHandler.js";
import { User } from "../models/user.model.js";
import mongoose, { Schema, Types } from "mongoose";
import { ApiError } from "../utility/ApiError.js";



const getChat = asyncHandler( async(req, res) => {
    const chatID = req.params.id
    if(!chatID) {
        return res.json(null);
    }
    try {
        const chat = await ChatRoom.findOne({_id: chatID}).populate("messages", " sender content createdAt") 
        return res.status(200).json(chat)
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "can't find any chat"})
    }
})

const getChatRoom = asyncHandler(async(req, res) => {
    const userID = req.user._id;
    console.log("The req.query is: ", req.query);
    let receiverID = req.query.receiverId;
    console.log("The receiverID is: ", receiverID)
    console.log("First check");
    receiverID = new mongoose.Types.ObjectId(receiverID);
    console.log("Second check");
    console.log("The receiver id is: ", receiverID);
    console.log("The userisd is : ", userID)
    try {
        const chatRoom = await ChatRoom.findOne({
            participants: {
                $all: [userID,receiverID]
            }
        }).populate("messages", " sender content createdAt")
        if(!chatRoom) {
            return res.json(null)
        }
        console.log("The chatroom is: ", chatRoom);
        return res.status(200).json(chatRoom)
    } catch (error) {
        console.log(error);
        if(error instanceof ApiError) {
            return res.status(error.statusCode).json({message: error.message})
        }
        res.status(404).json({message: "Can't find the Chatroom"})
    }
})

const getChats = asyncHandler( async(req, res) => {

    console.log("In getChats")
    const userID = req.user._id
    console.log("Userid is: ", userID)
    let chatWithReceivers = []

    try {
        const chats = await ChatRoom.find({participants: userID}).populate('lastMessage', 'content')
        for(const chat of chats) {
            const receiverID = chat.participants.find((id) => id.toString() !== userID.toString())
            console.log("Receiver id is: ", receiverID)
            if (receiverID) {
                const receiver = await User.findById(receiverID).select("_id username avatar")
                console.log(receiver)
                const chatWithReceiver = {
                    ...chat.toObject(), // Convert Mongoose document to plain JavaScript object
                    receiver: receiver
                };
                chatWithReceivers.push(chatWithReceiver)
            }
        }

        res.status(200).json(chatWithReceivers)
    } catch (error) {
        res.status(400).json({message: error.message || "No chats found"})
    }
})

const addChat = asyncHandler( async(req, res) => {
    const userID = req.user._id
    const participants = []
    if(userID) {
        participants.push(userID)
    }
    const receiverID = req.body.receiverId
    if(receiverID) {
        console.log(receiverID)
        participants.push(receiverID)
    }

    try {
        const newChat = await ChatRoom.create({participants: participants})
        if(newChat) {
            return res.status(200).json(newChat)
        }
    } catch (error) {
        console.log(error)
        res.status(400).json({message: error.message || "No chats found"})
    }
})


const readChat = asyncHandler(async (req, res) => {
    const chatID = req.params.id;
    console.log("Hello from readchat");
    try {
        const messages = await ChatRoom.findByIdAndUpdate(
            chatID,
            {
                $addToSet: { seenBy: req.user._id }
            },
            { new: true }
        )
        .populate('messages')
        .populate('participants', 'username')
        .populate('lastMessage')
        .populate('seenBy', 'username')
        .lean(); // Convert to plain JavaScript object

        if (!messages) {
            return res.status(404).json({ message: "Chat room not found" });
        }

        // Custom function to remove circular references
        const removeCircularReferences = (obj) => {
            const seen = new WeakSet();
            return JSON.parse(JSON.stringify(obj, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) {
                        return;
                    }
                    seen.add(value);
                }
                return value;
            }));
        };

        const safeMessages = removeCircularReferences(messages);
        return res.status(200).json(safeMessages);
    } catch (error) {
        console.log("Error from readchat: ", error);
        return res.status(500).json({ message: error.message || "An error occurred while processing the request" });
    }
});

export default readChat;

export {getChats, getChat, getChatRoom, addChat, readChat}