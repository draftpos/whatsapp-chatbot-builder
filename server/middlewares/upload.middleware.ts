import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder name (make sure it exists)
  },
  filename: (req, file, cb) => {
    // give unique name (timestamp + original name)
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg","image/x-icon", "image/vnd.microsoft.icon",
      "video/mp4", "video/webm", "video/ogg", "video/avi", "video/mov",
      "audio/mp3", "audio/wav", "audio/ogg", "audio/mpeg", "audio/m4a",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false); // Changed to match the expected type
      (req as any).fileFilterError = `Unsupported file type: ${file.mimetype}`;
    }
  },
});
