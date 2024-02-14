import mongoose,{isValidObjectId} from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";


//create a playlist
// then add a video in the playlist

const createPlaylist = asyncHandler(async(req,res)=>{
    // take name and description from body

    const {name,description} = req.body;
    if(!name?.split() || !description?.split()) throw new ApiError(400," All fields are required")

    const playlist = await Playlist.create({
        name,
        description,
        owner: req?.user._id
    })

    if(!playlist) throw new ApiError(500,"Something went wrong during playlist creation ")

    return res.status(200).json(new ApiResponse(200,playlist,"Playlist created successfully"))
})

const getUserPlaylist = asyncHandler(async (req,res)=>{
    const {ownerId} = req.params

    let userPlaylist;
    try {
        userPlaylist = await Playlist.find({
            owner:ownerId
        }).populate("owner")
        
    } catch (error) {
        throw new ApiError(400, "Invalid ownerId")
    }

    if(!userPlaylist)throw new ApiError(400, "Owner doesnt have playlist");

    return res.status(200).json(
        new ApiResponse(200, userPlaylist, "Playlist fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params;

    let playlistFind;
    try {
        playlistFind = await Playlist.findById(playlistId).populate("owner")
    } catch (error) {
        throw new ApiError(400, "Invalid playlistId")
    }
    
    if (!playlistFind) {
        throw new ApiError(400, "Playlist not found")
    }
    return res.status(200).json(
        new ApiResponse(200, playlistFind, "Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async(req,res)=>{
    // Logged in user can add videos to his play-list only
    
    const { playlistId, videoId } = req.params;

    let findPlaylist;
    try { 
        findPlaylist = await Playlist.findById(playlistId)

    } catch (error) {
        throw new ApiError(400, "Invalid playlistId")
    }


    if (!findPlaylist) {
        throw new ApiError(400, "Playlist not found")
    }

    if(String(findPlaylist.owner) !== String(req?.user._id)){
        throw new ApiError(400,"This is not your playlist to add videos")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, 'Invalid videoId')
    }
    
        
    const findVideo = await Video.findById(videoId)
    
    // console.log(findVideo)
    if (!findVideo) {
        throw new ApiError(400, "VIdeo not found")
    }

    if(!findPlaylist?.videos?.includes(videoId)){
        await findPlaylist.videos.unshift(findVideo)
        await findPlaylist.save({validateBeforeSave:false})
    }
    else{
        return res.status(400).json(
            new ApiResponse(400, findPlaylist, "Video is already in the playlist")
        );
    }

    
    return res.status(200).json(
        new ApiResponse(200, findPlaylist, "Video added successfully")
    );
})

const removeVideoToPlaylist = asyncHandler(async(req,res)=>{
    // Logged in user can remove videos to his play-list only
    
    const { playlistId, videoId } = req.params;

    let findPlaylist;
    try { 
        findPlaylist = await Playlist.findById(playlistId)

    } catch (error) {
        throw new ApiError(400, "Invalid playlistId")
    }


    if (!findPlaylist) {
        throw new ApiError(400, "Playlist not found")
    }

    if(String(findPlaylist.owner) !== String(req?.user._id)){
        throw new ApiError(400,"This is not your playlist , so you cant remove videos")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, 'Invalid videoId')
    }
    
        
    const findVideo = await Video.findById(videoId)
    

    if (!findVideo) {
        throw new ApiError(400, "VIdeo not found")
    }

    const idx = await findPlaylist.videos.indexOf(videoId)
    // console.log(idx)
    if(idx!==-1){
        await findPlaylist.videos.splice(idx,1);
        await findPlaylist.save({validateBeforeSave:false})
        return res.status(200).json(
            new ApiResponse(200, findPlaylist, "Video removed successfully")
        );
    }
    else{
        res.status(400).json(
            new ApiResponse(400, null, "Video not found in the playlist")
        );
    }
    
})


const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    let playlist;

    try { 
        playlist = await Playlist.findById(playlistId)

    } catch (error) {
        throw new ApiError(400, "Invalid playlistId")
    }
    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }
    if(String(playlist.owner) !== String(req?.user._id)){
        throw new ApiError(400,"This is not your playlist , so you cant delete the playlist")
    }

    try {
        playlist = await Playlist.findByIdAndDelete(playlistId)
    } catch (error) {
        throw new ApiError(400, "Invalid playlistId")
    }

    

    


    res.status(200).json(
        new ApiResponse(200, playlist, "Playlist deleted successfully")
    )
})


const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!name?.trim() && !description?.trim()) {
        throw new ApiError(400, "At least one field is required")
    }

    let playlist;

    try { 
        playlist = await Playlist.findById(playlistId)

    } catch (error) {
        throw new ApiError(400, "Invalid playlistId")
    }
    // console.log(playlist)
    if (!playlist) {
        throw new ApiError("Playlist not found")
    }
    if(String(playlist.owner) !== String(req?.user._id)){
        throw new ApiError(400,"This is not your playlist , so you cant update the playlist")
    }
    try {
        playlist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    name,
                    description
                }
            }, { new: true })

    } catch (error) {
        throw new ApiError(400, "Invalid playlistId")
    }

    
    res.status(200).json(
        new ApiResponse(200, playlist, "Playlist updated successfully")
    )
})

export {createPlaylist,getUserPlaylist,getPlaylistById,addVideoToPlaylist,removeVideoToPlaylist,deletePlaylist,updatePlaylist}