const path = require("path");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const uuid = require("uuid").v4;
const config = require("./config");

function createUpload() {
    if (!config.s3.enabled) {
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                return cb(null, "assets");
            },
            filename: function (req, file, cb) {
                const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
                return cb(null, `${Date.now()}-${uuid()}-${safeName}`);
            },
        });

        return multer({
            storage,
            limits: { fileSize: 5 * 1024 * 1024 },
            fileFilter: imageFileFilter,
        });
    }

    const s3 = new S3Client({ region: config.s3.region });

    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: imageFileFilter,
    });

    upload.saveFile = async function saveFile(file) {
        const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
        const key = `uploads/${Date.now()}-${uuid()}-${safeName}`;

        await s3.send(
            new PutObjectCommand({
                Bucket: config.s3.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            })
        );

        if (config.s3.publicBaseUrl) {
            return `${config.s3.publicBaseUrl.replace(/\/$/, "")}/${key}`;
        }

        return `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;
    };

    return upload;
}

function imageFileFilter(req, file, cb) {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
}

function resolveStoredFilePath(file, upload) {
    if (config.s3.enabled) {
        return upload.saveFile(file);
    }
    return Promise.resolve(file.path);
}

module.exports = {
    createUpload,
    resolveStoredFilePath,
};
