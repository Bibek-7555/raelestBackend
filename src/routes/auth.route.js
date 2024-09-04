import express from 'express'
import { loginUser, logoutUser, registerUser, refreshAllTokens } from '../controllers/auth.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJwt } from '../middlewares/authorization.js'

const router = express.Router()

router
.route("/register")
.post(
    upload.single('avatar'),
    registerUser)

router
.route("/login")
.post(loginUser)

router
.route("/refresh")
.patch(verifyJwt, refreshAllTokens)

router
.route("/logout")
.post(verifyJwt, logoutUser)

export default router