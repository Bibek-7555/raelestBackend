import express from 'express'
import { verifyJwt } from '../middlewares/authorization.js'


import { getChats, getChat, getChatRoom, addChat, readChat } from "../controllers/chatRoom.controller.js"



const router = express.Router()


router
.route("/")
.get(verifyJwt, getChats)
.post(verifyJwt, addChat)

router
.route("/:id")
.get(verifyJwt, getChat)

router
.route("/find/Chat")
.get(verifyJwt, getChatRoom);

router
.route("/read/:id")
.put(verifyJwt, readChat)

export default router