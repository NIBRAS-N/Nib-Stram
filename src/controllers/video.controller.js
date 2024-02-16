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

const getAllVideos = asyncHandler(async(req,res)=>{
    // take the page number , limit , query , sortBy , sortType , userId from query
    // check if the given userId is correct or not
    // perform aggregation pipeline

    let {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query;

    try {
        await User.findById(userId)
    } catch (error) {
        throw new ApiError(400,"Invalid User Id")
    }

    page = parseInt(page,10) || 1;
    limit = parseInt(limit , 10 ) || 1;

    const pipeline = [
        {
            $match:{
                // trim to remove spaace
                // if user dont give the id then show all the videos
                owner: userId?.trim() ? new mongoose.Types.ObjectId(userId) : { $exists: true, $ne: null},
                isPublished:true,
                // search the video with given query
                title:{ $regex: new RegExp(query?.trim().split(/\s+/).join('|'), 'i') }
            },
        },
        sortBy ? {$sort : { [sortBy] : sortType === "desc" ? -1 : 1 }} : undefined,
        {
            $skip: (page-1)*limit
        },
        {
            $limit: limit
        }
    ];

    const filterPipeline = pipeline.filter(Boolean)

    const videos = await Video.aggregate(filterPipeline)

    if(!videos) throw new ApiError(400,"No videos to show") 
    console.log(videos)

    res.status(200).json(new ApiResponse(200,videos,"videos fetched successfully"));

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // console.log(videoId)
    let video;
    try {
        video = await Video.findById(videoId)
    } catch (error) {
        throw new ApiError(400, "Invalid videoId ")
    }

    if (!video) {
        throw new ApiError(400, "Video does not exist")
    }
    const owner = video.owner;

    const videoOwner = await User.findById(owner);
    if(!videoOwner) throw new ApiError(200,"Owner of video missing")
    return res.status(200).json(
        new ApiResponse(200, video, `Video of ${videoOwner.username} -  "${video.title}"  fetched successfully`)
        
    )

})

const updateVideo = asyncHandler(async (req,res)=>{
    const {videoId} = req.params;
    let video;
    try {
        
        video = await Video.findById(videoId);
    } catch (error) {
        throw new ApiError(400, "Invalid videoId")
    }

    if(!video)throw new ApiError(400, "Video does not exist")

    const {title,description} = req?.body;

    if(!title?.trim() && !description?.trim() && !req.file) throw new ApiError(400,"Nothing to update")

    if(req?.file){
        if (!req?.file?.mimetype?.includes('image')) {
            throw new ApiError(400, "Invalid file type")
        }
    }

    let thumbnail;

    if(req?.file){ 
        thumbnail = await uploadOnCloudinary(req.file.path)
        if (!thumbnail) {
            throw new ApiError(500, "Something went wrong during file uploading")
        }
        deleteFromCloudinary(video.thumbnail)
    }



    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,

                description,

                thumbnail:thumbnail?.url
            }
        },
        {new:true}
    )

    if (!updatedVideo) {
        throw new ApiError(500, "Something went wrong during updation")
    }

    

    

    
    res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video details updated successfully")
    )
    

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    let video;
    try {
        
        video = await Video.findById(videoId);
    } catch (error) {
        throw new ApiError(400, "Invalid videoId")
    }

    if(!video)throw new ApiError(400, "Video does not exist")

    await deleteFromCloudinary(video.thumbnail)
    await deleteFromCloudinary(video.videoFile)

    let response
    try {
        
        response = await Video.findByIdAndDelete(videoId)
    } catch (error) {
        throw new ApiError(400, "Invalid VideoId")
    }
    if (!response) {
        throw new ApiError(400, "Video does not exist")
    }

    res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )

})


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    let videoOwnerCheck;
    
    try {
        videoOwnerCheck = await Video.findOne({
            _id: videoId,
            owner: req?.user?._id,
        });
    } catch (error) {
        throw new ApiError(400, "Invalid videoId")
    }

    if (!videoOwnerCheck) {
        throw new ApiError(404, "Permission denied");
    }


    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: { isPublished: !videoOwnerCheck.isPublished } },
        { new: true }
    );
    if (!updatedVideo) {
        throw new ApiError(500, "something went wrong during updation")
    }

    res.status(200).json(
        new ApiResponse(200, updatedVideo, "Publish status changed successfully")
    )

})
export {publishVideo,getAllVideos,getVideoById , updateVideo ,deleteVideo ,togglePublishStatus}