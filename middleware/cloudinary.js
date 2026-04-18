import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("Cloudinary Name:", process.env.CLOUDINARY_NAME);
if (!process.env.CLOUDINARY_API_KEY) {
    console.error("UPOZORENJE: CLOUDINARY_API_KEY NIJE UČITAN!");
}

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chat-app',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
  },
});

export const upload = multer({ storage: storage });