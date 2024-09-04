import express from 'express'
import { verifyJwt } from '../middlewares/authorization.js'
import { addMessage } from '../controllers/message.controller.js'



const router = express.Router()

router
.route("/:chatID")
.post(verifyJwt, addMessage)



export default router