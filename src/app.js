import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'


const app = express()

app.use(cors({origin: process.env.CLIENT_URL, credentials: true}))
app.use(express.json())
app.use(cookieParser())

import authRoute from "./routes/auth.route.js"
import userRoute from "./routes/user.route.js"
import postRoute from "./routes/post.route.js"
import messageRoute from "./routes/message.route.js"
import chatRoomRoute from "./routes/chatRoom.route.js"

app.use("/api/auth", authRoute)
app.use("/api/user", userRoute)
app.use("/api/posts",postRoute)
app.use("/api/chatRooms", chatRoomRoute)
app.use("/api/messages", messageRoute)


export {app}