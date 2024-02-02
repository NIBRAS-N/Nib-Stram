import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"




cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

export {uploadOnCloudinary}

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
