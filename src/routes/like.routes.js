import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
} from "../controllers/like.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); 

router.route("/toggle/v/:videoId").get(toggleVideoLike);
router.route("/toggle/c/:commentId").get(toggleCommentLike);
router.route("/toggle/t/:tweetId").get(toggleTweetLike);

router.route("/myVideos").get(getLikedVideos);

export default router