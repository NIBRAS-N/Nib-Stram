import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"




// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

const connectCloudinary = async()=>{
  try {
       await cloudinary.config({ 
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
          api_key: process.env.CLOUDINARY_API_KEY, 
          api_secret: process.env.CLOUDINARY_API_SECRET 
        });    
        console.log("cloudinary connected ")
  } catch (error) {
      console.log("error in connecting coludinary ",error)
      throw error
  }
  
  
}

connectCloudinary()

// ekta method banabo,oy method e parameter hishebe ekta local file path nibo, oy file cloudinary te upload korbo. upload korar por file path unlink kore dibo..

const uploadOnCloudinary = async(localFilePath) =>{
    try {

      if(!localFilePath) return null;

      const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
      });

      //upload the file on cloudinary
      console.log("file is uploaded on cloudinary", response.url);

      fs.unlinkSync(localFilePath)
      return response;
      
    } catch (error) {
      console.log("error in || src || utils || cloudinatu || catch", error);

      fs.unlinkSync(localFilePath);
      return null;
    }
}

const deleteFromCloudinary = async(fileUrl) =>{
  try {

    if(!fileUrl?.trim() === "") return;

    const publicId = fileUrl.split("/").pop().split(".")[0];

    console.log(publicId)

    const result = await cloudinary.uploader.destroy(publicId);

    // console.log(result)

    if(result.result == "ok"){
      console.log("file Deleted successfully")
    }
    else{
      console.log("Failed to delete the file")
    }
  } catch (error) {
      console.log("error deleting file from cloudinary ", error.message)
  }
}

export {uploadOnCloudinary , deleteFromCloudinary,connectCloudinary}

// const connectCloudinary = async ()=>{
//   try {

//     const abc = await cloudinary.config({ 
//       cloud_name: 'nibras-n', 
//       api_key: '861396359585186', 
//       api_secret: 'eNQX9pH-qrq2j4_IsPlmbz7xkMQ' 
//     });

//   } catch (error) {
//       console.log("src || utils || cloudinary", error);
//       throw error;
//   }
// }
