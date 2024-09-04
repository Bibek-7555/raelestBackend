import express from 'express'
import { Router } from 'express'
import { deleteUser, getAllUsers, getUser, updateUser, savePost, profilePosts, getNotificationNumber } from '../controllers/user.controller.js'
import { verifyJwt } from '../middlewares/authorization.js'
import { upload } from '../middlewares/multer.middleware.js'


const router = express.Router()


router
.route("/")
.get( getAllUsers)

router
.route("/:id")
.get(verifyJwt, getUser)
.put(
        verifyJwt, 
        upload.single('avatar'),
        updateUser
    )
.delete(verifyJwt, deleteUser)

router
.route("/save")
.post( verifyJwt, savePost )

router
.route("/profile/Posts")
.get( verifyJwt, profilePosts)

router
.route("/my/notification")
.get(verifyJwt,getNotificationNumber)


export default router