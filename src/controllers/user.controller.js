import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import jwt  from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";

const generateAccessAndRefresToken = async (userId)=>{
    try {

        const user = await User.findById(userId);
        
        // console.log("is there any field name gen acc",user.generateAccessToken)

        const accessToken = user.generateAccessToken();

        const refreshToken = user.generateRefreshToken();

        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});

        // console.log("refresh token: ",refreshToken," access token: ",accessToken);

        return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500,"something went wrong while generating refresh and access token");
    }
}

const registerUser = asyncHandler( async (req,res,next) =>{

    
    // res.status(200).json({
    //     message:"ok"
    // })

    //step to write register
    //..................................
    //get user detail from frontened -> user.routes.js->

    //valdation - email , password etc are empty or not

    //check if user already exist- email,username

    //check for image , check for avatar

    //upload them to cloudinary , check in cloudinary

    //create user object - create entry in db

    //remove password and refreshtoken field from response

    //check for use creation

    //if user created , return res

     const {username,email,fullName,password} = req.body;

    //  console.log(username);
    //  console.log(email)

    
    
    if([username,email,fullName,password].some((item)=>
        item?.trim()==""))
    {
        throw new ApiError(404,"All field are required");
    }
    
    // In Mongoose, the $or operator is used as part of MongoDB queries to perform a logical OR operation. It allows you to specify multiple conditions, and at least one of these conditions must be satisfied for a document to match the query.


    const existedUser = await User.findOne({
        $or:[
            {username},
            {email}
        ]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or userName already exist");
    }

    // console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;

    //because our model says coverImage is not a necessary files.

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath="";
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);


    if(!avatar){
        throw new ApiError(400,"Avatar file not uploaded");

    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "--password --refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"something went wrong on registring the user");
    }

    
    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered sussessfully")
    )
})

const loginUser = asyncHandler(async (req,res) =>{
    // collect username or email , password from req.body
    // validate email or username , password,[empty or not]
    //  find the user  by given username and email
    // password check
    // access and refresh token
    // send cookies
    // response

    const { username, email , password} =  req.body;

//logic-1
//........
/*
    let email_f="" , username_f="";

    if(new RegExp("@.com").test({email}) )email_f=email;
    
    else username_f=email;

    if(email_f!=""){
        if([email_f , password].some((item)=>item?.trim=="")){    
            throw new ApiError(404,"Email or Username and password");
        }
    }
    else {
        if([username_f , password].some((item)=>item?.trim=="")){    
            throw new ApiError(404,"Email or Username and password");
        }
    }
*/
//  if(1 && 0)
    // console.log(username," ",email);
    if(!username && !email){
        throw new ApiError(404,"Email or Username and password not found");
    }
// if(!(username || email))

    const user  = await User.findOne({
        $or:[
            {username},
            {email}
        ]
    })

    if(!user){
        throw new ApiError(404,"User doesnt exist");
    }

    //console.log("user:",user)


// we created a custom schema  name isPasswordCorrect in user.model.js. User is mongoose property. user is my property . thats isPasswordCorrect is avilable in user

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Password incorrect , invalid users credintials");
    }

    const {refreshToken,accessToken} = await generateAccessAndRefresToken(user._id);

    
    // update user er refreshToken and accessToken from user not User
/*
    user.refreshToken= refreshToken;
    const loggedInUser = user.select("--password --refreshToken");
*/
    // update user er refreshToken and accessToken from User not user

    const loggedInUser = await User.findById(user._id).select("--password --refreshToken")

    //console.log("loggedInUser",loggedInUser);
    const options = {
        httpOnly: true,
        secure:true
    }

    //console.log("req.user : ",req.user);

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            user:loggedInUser,
            accessToken,
            refreshToken
        } ,
        "User Logged in Successfully"
        )
    )
})
    


const logoutUser = asyncHandler(async(req,res)=>{
    // console.log("above",req.user);
    // console.log("above",res.user);
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken:1
            }
        },

        {
            //this used to return the new updated 
            new:true
        }
    )
    
    // console.log("BELOW",req.user);
    // console.log("below",res.user);
    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged Out"));
})



const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    // console.log("lol",incomingRefreshToken)
    if(!incomingRefreshToken){
        throw ApiError(401,"unauthorized request");
    }

    try {

        const decodeToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodeToken?._id)

        if(!user){
            throw new ApiError(401 , "invalid refresh Token");
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError("refresh token is expired or used");
        }

        const {accessToken , newrefreshToken} = await generateAccessAndRefresToken(user._id)

        const options = {
            httpOnly:true,
            secure:true
        }

        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,refreshToken:newrefreshToken
                },
                "Access Token Refreshed"
            )
        )
    
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})


const changeCurrentPassword = asyncHandler(async(req,res)=>{
    // console.log("req",req?.user);
    const {oldPassword,newPassword} = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect) throw new ApiError(400,"Invalid old password");

    user.password = newPassword;

    await user.save({validateBeforeSave:false});

    return res.status(200)
    .json(new ApiResponse(200,{},"password changed successfully"));

})

const getCurrentUser = asyncHandler(async(req,res,next)=>{
    return res.status(200)
    .json(new ApiResponse(200,req.user,"user fetched successfully"));
})
    
//update text base data
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {email,fullName} = req.body;

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        }
    ).select("--password");

    return res.status(200)
    .json(new ApiResponse(200,user, "Account details updated successfully"));



})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath) throw ApiError(400,"Avatar file is missing");

    // todo: delete old image
    await deleteFromCloudinary(req?.user.avatar)

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on Avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("--password");

    return res.status(200)
    .json(new ApiResponse(200,user,"avatar image updated successfully"));


})
const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath) throw ApiError(400,"Avatar file is missing");

    // todo: delete old image

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading coverImage");
    }

    await deleteFromCloudinary(req?.user.coverImage)

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select("--password");

    return res.status(200)
    .json(new ApiResponse(200,user,"cover image updated successfully"));


})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400,"Username is missing");
    }
    
    const channel = await User.aggregate([ 
        {
            $match:{
                username: username?.toLowerCase()

            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelsSubcribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if :{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }

        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubcribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }    
    ])

    if(!channel?.length){
        throw new ApiError(404,"channel does not exist");
    }
    return res.status(200)
    .json(new ApiResponse(200,channel[0],"User channel fetched successfully"));
})

const getWatchHistory = asyncHandler(async (req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id" ,
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner" 
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(
            200,
            user[0].watchHistory,
            "watchHistory fetched successfully"
        )
    )

})

const videoWatched = asyncHandler(async(req,res)=>{
    const {videoId} = req.params

    let checking  ; 
    try {
        checking = await Video.findById(videoId)
    } catch (error) {
        throw new ApiError(400,"Invalid VideoId");
    }
    if(!checking) throw new ApiError(500,"Video Not found");

    const user = await User.findById(req?.user._id);


    if(!user) throw new ApiError(400,"something went wrong finding logged in user");

    const checking2 = await user.watchHistory.includes(checking._id);
    if(checking2){
        return res.status(400).json(new ApiResponse(400,user,`title : "${checking.title} " already in watch History`));
    }
    await user.watchHistory.unshift(checking);

    await user.save({validateBeforeSave:false});

    return res.status(200).json(new ApiResponse(200,user,`title : ${checking.title} added to watch History`));
    
})

export {registerUser,loginUser,logoutUser , refreshAccessToken, changeCurrentPassword , getCurrentUser , updateAccountDetails , updateUserAvatar , updateUserCoverImage , getUserChannelProfile,getWatchHistory,videoWatched};