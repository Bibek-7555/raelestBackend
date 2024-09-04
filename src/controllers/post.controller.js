import { Post } from "../models/post.model.js";
import { PostDetail } from "../models/postDetail.model.js";
import { Saved } from "../models/savedPost.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utility/ApiError.js";
import { ApiResponse } from "../utility/ApiResponse.js"
import { asyncHandler } from "../utility/asyncHandler.js";
import jwt from 'jsonwebtoken'




const getPosts = asyncHandler( async(req, res) => {
    const query = req.query
    console.log(query)
    const queryObject = {}
    if (query.city) {
        queryObject.city = query.city;
      }
      if (query.type) {
        queryObject.type = query.type;
      }
      if (query.property) {
        queryObject.property = query.property;
      }
      queryObject.price = {
        $gte: parseInt(query.minPrice) || 0,
        $lte: parseInt(query.maxPrice) || 10000000
      }
      if (query.bedroom) {
        queryObject.bedroom = parseInt(query.bedroom);
      }
    try {
        
        const posts = await Post.find(queryObject)
        console.log(posts)
        res.status(200).json(new ApiResponse(200, posts, "Posts fetched successfully"))
    } catch (error) {
        res.status(403).json({message: error.message})
    }
})

const getPost = asyncHandler( async(req, res) => {
    const id = req.params.id
    try {
        const post = await Post.findById(id).populate("postOwner", "username email avatar").populate("postDetail")
        let userID;
        const token = req.cookies?.accessToken
        if(!token) {
            userID = null
        } else {
            const decoded_Token = jwt.decode(token, process.env.ACCESS_TOKEN_SECRET)
            userID = decoded_Token?._id
        }
        let saved
        if (userID) {
            saved = await Saved.findOne({userID: userID, postID: id })
            console.log("Saved post is: ", saved)
        }
        return res.status(200).json(new ApiResponse(200, {...post,isSaved: saved ? true : false }, "Post fetched successfully"))
    } catch (error) {
        console.log(error)
        res.status(500).json({message: error.message})
    }
})

const addPosts = asyncHandler( async(req, res) => {
    const {postData, postDetails} = req.body

    console.log("PostDatas are here: ", postData)
    console.log("PostDetails are here: ", postDetails)
    const userId = req.user?._id

    try {
        const newpostDetail = await PostDetail.create({...postDetails})

        if(!newpostDetail) {
            throw new ApiError(500, "Couldn't create postDetails")
        }

        console.log("New post details are: ", newpostDetail)
        const newPost = new Post(
         {
             ...postData,
             postDetail: newpostDetail._id,
             postOwner: userId
         }
    
        )
        await newPost.save()
        await newPost.populate([
            {path: 'postOwner', select: 'username avatar'},
            {path: 'postDetail'}
        ])

        if(!newPost){
            throw new ApiError(500, "Couldn't create posts")
        }

        console.log("New post is: ", newPost)

        newpostDetail.detailOfPost = newPost._id
        newpostDetail.save({validateBeforeSave: false})

        const user = await User.findByIdAndUpdate(userId,
            {
                $push: {posts: newPost._id}
            },
            {new: true}
        )

        if(!user) {
            throw new ApiError(400, "User not found to add post")
        }

        console.log("Post created successfully: ", newPost )
        console.log("After craeting the post and updatig the user is: ", user)
        return res.status(200).json(new ApiResponse(200, newPost, "Post created successfully"))
   } catch (error) {
        console.log(error)
        return res.status(error.statusCode).json({message: "pata nahi kya error he"})
   }
})

const updatePosts = asyncHandler( async(req, res) => {
    
})

const deletePosts = asyncHandler( async(req, res) => {
    const id = req.params.id
    const userId = req.user._id

    try {
        const post = await Post.findById(id)
        if(post.postOwner !== userId) {
            throw new ApiError(403, "You are not the owner of the post")
        }
    
        const deletedPost = await Post.findByIdAndDelete(id)
    
        res
        .status(200)
        .json(new ApiResponse(200, null, "Post deleted successfully"))
    } catch (error) {
        console.log("Error: ", error)
        res.status(403)
        .json({message: error.message})
    }
})



export {
    getPosts,
    getPost,
    addPosts,
    updatePosts,
    deletePosts
}