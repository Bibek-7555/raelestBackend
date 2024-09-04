import mongoose, {model, Schema} from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    posts: [
        {
            type: Schema.Types.ObjectId,
            ref: "Post"
        },
    ],
    avatar: {
        type: String
    },
    refreshToken: {
        type: String
    },
    savedPosts: [{
        type: Schema.Types.ObjectId,
        ref: "Saved"
    }],
    chatRooms: [{
        type: Schema.Types.ObjectId,
        ref: "ChatRoom"
    }]
},
{
    timestamps: true
})

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next()

    this.password = await bcrypt.hash(this.password, 8)
    next()

})

userSchema.pre("findOneAndUpdate", async function(next) {
    const update = this._update
    console.log("this._update: ", update)
    if(update.$set && update.$set.password) {
        update.$set.password = await bcrypt.hash(update.$set.password, 8)
    }
    next()
})

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign({
        _id: this._id,
        username: this.username,
        email: this.email
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({
        _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User = mongoose.model("User", userSchema)