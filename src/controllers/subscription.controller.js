import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {Subscription} from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose,{isValidObjectId} from "mongoose";




const toggleSubscription = asyncHandler(async(req,res)=>{
    //If logged in user previously subscribed the channel , then unsubscribe
    // else subscribe
    // channel id will be provided

    const {channelId} = req.params
    
    if(!channelId)throw new ApiError(400,"No channelId found")
    const userId = req?.user._id ;

    if(String(userId) === String(channelId)){
        throw new ApiError(400,"invalid request");
    }

    const channelOwner = await User.findById(channelId)

    if(!channelOwner)throw new ApiError(400,"channel Id not valid");
    let subscrip_tion;
    let msg=""
    try {
        subscrip_tion = await Subscription.findOneAndDelete({
            
            subscriber:userId,
            channel:channelId
            
        })
        msg="Unsbscription done"
    } catch (error) {
        throw new ApiError(400,`Invalid channel Id ,\n ${error}`);
    }

    if(!subscrip_tion){
        try {
            subscrip_tion = await Subscription.create({
            
                subscriber:userId,
                channel:channelId
                
            })
            msg = "Subscribed successfully"
        } catch (error) {
            throw new ApiError(500, `Something went wrong during subscribing\n ${error}`)
        }
    }   
    if (!subscrip_tion) {
        throw new ApiError(500, "Something went wrong during subscribing")
    }

    const populateSubscrip_tion = await Subscription.findById(subscrip_tion._id).populate("subscriber")

    let f=true;

    if(!populateSubscrip_tion) f=false

    // console.log(populateSubscrip_tion)

    return res.status(200).json(
        new ApiResponse(200, f?populateSubscrip_tion:subscrip_tion, `${channelOwner.username}'s channel ${msg} `)
    )
})


const getUserChannelSubscribers = asyncHandler(async (req,res)=>{
    //  Given channel  er subscriber der list khuje ano
    const {channelId} = req.params;

    if(!channelId)throw new ApiError(400,"No channelId found")

    let userSubcribers;
    try {
        userSubcribers = await Subscription.aggregate([
            {
                $match:{
                    "channel":new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup:{
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "userSubscribers"
                }
            },
            {
                $unwind:"$userSubscribers"
                
            },
            {
                $replaceRoot:{
                    'newRoot':"$userSubscribers"
                }
            }
        ])
    } catch (error) {
        throw new ApiError(400, "Invalid ChannelId")
    }

    return  res.status(200).json(new ApiResponse(200,userSubcribers,"Channel subscribers fetched successfully"))
})


const getUserSubscribedChannels = asyncHandler(async(req,res)=>{
    // logeed in user  je channel subscribe korse oder list dite hobe
    const userId = req?.user._id;

    let mySubscribedChannels;

    try {
        mySubscribedChannels = await Subscription.aggregate([
            {
                $match:{
                    'subscriber': new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"channel",
                    foreignField:"_id",
                    as:"subscribedChannels"
                }
            },
            {
                '$unwind': '$subscribedChannels'
            },
            {
                '$replaceRoot': {
                    'newRoot': '$subscribedChannels'
                }
            }
        ])


    } catch (error) {
         throw new ApiError(400, "Invalid ChannelId")
    }

    return res.status(200).json(
        new ApiResponse(200, mySubscribedChannels, `me(Logged in user) ${req.user.username}'s subscribed channels fetched successfully`)
    )

})
export {toggleSubscription , getUserChannelSubscribers , getUserSubscribedChannels}