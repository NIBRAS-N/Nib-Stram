import {Router} from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import {createPlaylist,getUserPlaylist,getPlaylistById,addVideoToPlaylist,removeVideoToPlaylist,deletePlaylist,updatePlaylist} from "../controllers/playlist.controller.js"

const router = Router()
router.use(verifyJWT)

router.route("/").post(createPlaylist)

router.route("/:playlistId")
    .get(getPlaylistById)
    .delete(deletePlaylist)
    .patch(updatePlaylist)
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(removeVideoToPlaylist);
router.route("/add/:ownerId").patch(getUserPlaylist)


export default router