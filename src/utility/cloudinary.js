import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) {
            console.log("Can't find localfilepath")
            return null
        }
    
        const cloudinaryUpload = await cloudinary.uploader
        .upload(
            localFilePath,
            {
                resource_type: 'auto'
            }
        )
    
        console.log("Uploaded to cloudinary successfully: ", cloudinaryUpload.url)
    
        fs.unlinkSync(localFilePath)

        return cloudinaryUpload
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

export {uploadOnCloudinary}