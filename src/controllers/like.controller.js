import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import mongoose from "mongoose";


const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;

    let likeVideo;
    let msg="";
    try {
        likeVideo = await Like.findOneAndDelete({
            video:videoId,
            likedBy:req?.user._id
        })
        msg = `LikeVideo deleted successfully `;
    } catch (error) {
        throw new ApiError(400, "Invalid videoId")
    }

    if (!likeVideo) {
        likeVideo = await Like.create({
            video: videoId,
            likedBy: req?.user._id
        })
        if (!likeVideo) {
            throw new ApiError(500, "Something went wrong during  liking video");
        }
        msg = "Liking Video done successfully";
    }

    return res.status(200).json(
        new ApiResponse(200, likeVideo, msg)
    )
})


const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { user } = req;
    let like;
    let message = "";
    try {
        like = await Like.findOneAndDelete({
            comment: commentId,
            likedBy: user._id
        })
        message = "Like deleted successfully";
    } catch (error) {
        throw new ApiError(400, "Invalid videoId")
    }

    if (!like) {
        like = await Like.create({
            comment: commentId,
            likedBy: user._id
        })
        if (!like) {
            throw new ApiError(500, "Something went wrong during creating like");
        }
        message = "Like created successfully";
    }
    return res.status(200).json(
        new ApiResponse(200, like, message)
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    const { user } = req;
    let like;
    let message = "";
    try {
        like = await Like.findOneAndDelete({
            tweet: tweetId,
            likedBy: user._id
        })
        message = "Like deleted successfully";

    } catch (error) {
        throw new ApiError(400, "Invalid videoId")
    }

    if (!like) {
        like = await Like.create({
            tweet: tweetId,
            likedBy: user._id
        })
        if (!like) {
            throw new ApiError(500, "Something went wrong during creating like");
        }
        message = "Like created successfully";
    }
    return res.status(200).json(
        new ApiResponse(200, like, message)
    )
}
)


const getLikedVideos = asyncHandler(async(req,res)=>{
    // user je video golo like korse ogolo fetch kore ano
     
    const myLikedVideos = await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req?.user._id),
                video:{$exists:true}
            }
        },
        {
            $lookup:{
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                as: 'likedVideos'
            }
        },
        {
            $unwind: '$likedVideos'
        },
        {
            $replaceRoot: {
                newRoot: '$likedVideos'
            }
        }
    ])

    if (!myLikedVideos) {
        throw new ApiError(400, "Liked videos not found")
    }
    return res.status(200).json(
        new ApiResponse(200, myLikedVideos, "Liked videos fetched successfully")
    )
})
export {toggleVideoLike,toggleCommentLike,toggleTweetLike,getLikedVideos}