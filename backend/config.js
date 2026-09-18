require("dotenv").config();

function parseList(value, fallback) {
    if (!value || !String(value).trim()) {
        return fallback;
    }
    return String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

const config = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 1111),
    sessionSecret: process.env.SESSION_SECRET || "change-me-in-production",
    corsOrigins: parseList(process.env.CORS_ORIGINS, [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]),
    redisUrl: process.env.REDIS_URL || "",
    mysql: {
        host: process.env.MYSQL_HOST || "localhost",
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || "",
        database: process.env.MYSQL_DATABASE || "storage",
    },
    s3: {
        enabled: Boolean(process.env.AWS_S3_BUCKET),
        bucket: process.env.AWS_S3_BUCKET || "",
        region: process.env.AWS_REGION || process.env.AWS_S3_REGION || "us-east-1",
        publicBaseUrl: process.env.AWS_S3_PUBLIC_BASE_URL || "",
    },
};

config.isProduction = config.nodeEnv === "production";

module.exports = config;
