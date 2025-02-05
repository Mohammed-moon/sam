import multer from 'multer';
import path from 'path';

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use an absolute path to ensure the uploads folder is correctly resolved
    cb(null, path.resolve('uploads')); // Directory to save uploaded files
  },
  filename: (req, file, cb) => {
    // Set the file name to be the current timestamp and the original file extension
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Initialize upload middleware with validation and limits
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
  },
  fileFilter: (req, file, cb) => {
    const fileTypes = /pdf|docx|doc|jpg|jpeg|png/; // Allow both image and document files
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true); // File type is valid
    } else {
      cb(new Error('Only .pdf, .docx, .doc, .jpg, .jpeg, or .png files are allowed'));
    }
  },
});

export default upload;