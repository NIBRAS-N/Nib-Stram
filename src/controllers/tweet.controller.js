import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";


const createTweet = asyncHandler(async(req,res)=>{
    const { user } = req;
    const { content } = req.body;
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: user._id
    })

    if (!tweet) {
        throw new ApiError(500, "Something went wrong during tweet creation")
    }

    const pop = await Tweet.findById(tweet._id).populate("owner");
    if(!pop)throw new ApiError(500, "Something went wrong during populating")
    return res.status(200).json(
        new ApiResponse(200, pop, `Tweet of ${pop.owner.username} created successfully`)
    )


})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params

    let tweets;
    try {
        tweets = await Tweet.find({
            owner: userId
        }).populate("owner")
    } catch (error) {
        throw new ApiError(400, "Invalid userId")
    }
    console.log(tweets.length)
    if (!tweets) {
        throw new ApiError(400, "Tweets not found")
    }
    return res.status(200).json(
        new ApiResponse(200, tweets, "Tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required")
    }

    const { tweetId } = req.params;
    const { user } = req;
    let tweet;

    try {
        tweet = await Tweet.findOneAndUpdate({
            _id: tweetId,
            owner: user._id
        },
            {
                $set: {
                    content
                },
            },
            { new: true }
        ).populate("owner")
    } catch (error) {
        throw new ApiError(400, "Invalid tweetId or you are not owner of the tweet")
    }

    if (!tweet) {
        throw new ApiError(400, "tweet not found or you are not owner of the tweet")
    }
    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet updated successfully")
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { user } = req;
    let deletedTweet;

    try {
        deletedTweet = await Tweet.findOneAndDelete({
            _id: tweetId,
            owner: user._id
        }
        )
    } catch (error) {
        throw new ApiError(400, "Invalid tweetId")
    }

    if (!deletedTweet) {
        throw new ApiError(400, "tweet not found or you are not owner of the tweet to delete")
    }
    return res.status(200).json(
        new ApiResponse(200, deletedTweet, "Tweet deleted successfully")
    )
})
export {createTweet,getUserTweets,updateTweet , deleteTweet}
