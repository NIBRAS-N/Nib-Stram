import multer from "multer";



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      // theres something to change 
      cb(null, file.originalname)
    }
  })
  
  export const upload = multer({ 
    storage 
})