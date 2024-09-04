import express from 'express'
import { verifyJwt } from "../middlewares/authorization.js"
import { addPosts, deletePosts, getPost, getPosts, updatePosts } from '../controllers/post.controller.js'


const router = express.Router()

router
.route("/")
.get(getPosts)
.post( verifyJwt, addPosts )

router
.route("/:id")
.get(getPost)
.put(verifyJwt, updatePosts)
.delete(verifyJwt, deletePosts)

export default router