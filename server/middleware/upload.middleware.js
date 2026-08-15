import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".svg",
];

const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
];

const fileFilter = (req, file, cb) => {
    const extension = path
        .extname(file.originalname)
        .toLowerCase();

    console.log("Uploaded file:", {
        originalname: file.originalname,
        mimetype: file.mimetype,
        extension,
    });

    const validExtension = allowedExtensions.includes(extension);
    const validMimeType = allowedMimeTypes.includes(file.mimetype);

    // Accept if either MIME type OR extension is valid
    if (validMimeType || validExtension) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only JPG, JPEG, PNG, WEBP, GIF and SVG images are allowed"
            ),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
});

export default upload;