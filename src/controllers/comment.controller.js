import mongoose,{isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required")
    }
    const { videoId } = req.params;
    let video;
    try {
        video = await Video.findById(videoId)
    } catch (error) {
        throw new ApiError(400, "Invalid videoId")
    }
    
    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    const user = req.user;

    // console.log(user)

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: user
    })
    if (!comment) {
        throw new ApiError(400, "Something went wrong during comment creation")
    }

    res.status(200).json(
        new ApiResponse(200, comment, "Commented successfully")
    )


})

const getVideoComments = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    let {page=1,limit=10} = req.query;

    page = parseInt(page,10)||1;
    limit = parseInt(limit,10)||10;

    let video;

    try {
        video = await Video.findById(videoId);
    } catch (error) {
        throw new ApiError(400, "Invalid videoId");
    }

    if(!video)   throw new ApiError(400, "Video not found")

    const comments = await Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $skip: (page-1) * limit
        },
        {
            $limit: limit
        }
    ])

    if(!comments){
        throw new ApiError(400, "No Comments")
    }

    return res.status(200).json(
        new ApiResponse(200, comments, "Comments fetched successfully")
    )
})  

const updateComment = asyncHandler(async(req,res)=>{
    // if you are not owner of the comment , then you can not update the comment
    const {commentId } = req.params;
    const {content} = req.body;

    if(!content?.trim()){
        throw new ApiError(400, "Content is required")
    }
    console.log(req?.user._id)
    let comment ;

    // try {
    //     comment = await Comment.findById(commentId)
    // } catch (error) {
    //     throw new ApiError(400, "Comment id not matched",error)
    // }
    
    // if(String(comment?.owner)!==String(req?.user.id)){
    //     return res.status(400).json(
    //         new ApiResponse(400, {}, "You are not owner to edit this comment")
    //     )
    // }

    try {
        comment = await Comment.findOneAndDelete(
            {
                
                owner:new mongoose.Types.ObjectId(req?.user._id),
                _id:new mongoose.Types.ObjectId(commentId) ,
                
            },
            {
                $set:{
                    content:content
                }
            },{new:true}
        )
    } catch (error) {
        
        throw new ApiError(400, "Comment ID not matched or You are not owner of this comment to edit")
    }
    // console.log(comment);
    if (!comment) {
        return res.status(400).json(
            new ApiResponse(400, {}, "You are not owner to edit this comment or CommentId is not valid")
        )
        // throw new ApiError(400, "Comment does not exist")
    }
    
    return res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // if you are not owner of the comment , then you cannot delete the comment
    // if you are the owner of the video , then you can delete any comment

    const { commentId } = req.params;
    const { user } = req;


    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, 'Invalid comment Id')
    }

    const commentFinding = await Comment.findById(commentId);

    if(!commentFinding) throw new ApiError("invalid commentID")

    const checkForVideoOwner = await Video.findById(commentFinding.video)


    console.log(String(checkForVideoOwner.owner), " " , String(req.user.id));

    //If you are the owner of the video, you can delete it
    if(String(checkForVideoOwner.owner) === String(req?.user._id)){

        console.log("lol")
        const deletingComment = await Comment.deleteOne({_id:commentId})
        if(!deletingComment) throw new ApiError(400,"comment couldnt deleted");
        return res.status(200).json(new ApiResponse(200,deletingComment,"You are owner of the video, You deleted this comment"));    
    }

    // if you are not owner of video,, then check if you are the owner of comment or not
    let deletedComment;
    try {
        deletedComment = await Comment.findOneAndDelete({
            _id: commentId,
            owner: user._id
        })
    } catch (error) {
        throw new ApiError(400, "Invalid commentId")
       
    }
    console.log(deletedComment)
    if (!deletedComment) {
        // throw new ApiError(400, "Comment does not found")
        
        return res.status(400).json(
            new ApiResponse(400, {}, "You are not owner to delete this comment or CommentId is not valid")
        )
    }

    res.status(200).json(
        new ApiResponse(200, deletedComment, "Comment deleted successfully")
    )
})
export {addComment,getVideoComments,updateComment,deleteComment } 