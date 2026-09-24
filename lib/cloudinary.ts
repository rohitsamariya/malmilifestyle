import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
// It automatically picks up CLOUDINARY_URL if set, or the specific variables below.
// Ensure these variables are set in your Render environment.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
