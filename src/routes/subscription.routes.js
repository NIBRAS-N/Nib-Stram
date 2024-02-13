import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {toggleSubscription,getUserChannelSubscribers,getUserSubscribedChannels} from "../controllers/subscription.controller.js"

const   router = Router();



router.use(verifyJWT);

router.route("/c/:channelId").post(toggleSubscription).get(getUserChannelSubscribers)

router.route("/c").get(getUserSubscribedChannels)
export default router