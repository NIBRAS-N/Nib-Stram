import mongoose,{isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary,uploadOnCloudinary } from "../utils/cloudinary.js";

const publishVideo = asyncHandler( async (req,res)=>{
    // take title , description from req.body
    // check 
    // take localPath  of video and thumbnail
    // check
    // upload the localPath of video and thumbnail in cloudinary
    // check
    // calculate duration
    // upload in collection
    // check
    // return response

    const {title, description} = req.body;

    if([title,description].some( (item)=>item.trim() === "") ){
        throw new ApiError(400,"All fields are required");
    }

    console.log(req?.files);

    const videoLocalPath = req?.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req?.files?.thumbnail[0]?.path;
    
    if(
        !videoLocalPath || 
        !thumbnailLocalPath || 
        !req.files?.videoFile[0]?.mimetype.includes('video') ||
        !req.files?.thumbnail[0]?.mimetype.includes('image') 
    )throw new ApiError(400 , "Video and thumbnail are required or invalid file type");

    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail || !videoFile) throw new ApiError(500,"Error while uplaoding video or thumbnail");

    const duration = Math.floor(videoFile.duration);

    // console.log(duration , videoFile.duration);

    const video = await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration,
        owner:req?.user
    })
    
    if(!video) throw new ApiError(500,"something went wrong during video creation")

    return res.status(200).json(new ApiResponse(200,video,"video published successfully"));

})

export {publishVideo}