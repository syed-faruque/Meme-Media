const session = require("express-session");
const config = require("./config");

async function createSessionMiddleware() {
    const sessionOptions = {
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: config.isProduction,
            maxAge: 1000 * 60 * 60 * 24 * 7,
        },
    };

    if (config.redisUrl) {
        const { createClient } = require("redis");
        const RedisStore = require("connect-redis").default;
        const redisClient = createClient({ url: config.redisUrl });
        redisClient.on("error", (err) => {
            console.error("Redis error:", err);
        });
        await redisClient.connect();
        sessionOptions.store = new RedisStore({ client: redisClient });
        console.log("Using Redis session store");
    } else {
        console.log("Using in-memory session store (set REDIS_URL for shared sessions)");
    }

    return session(sessionOptions);
}

module.exports = {
    createSessionMiddleware,
};
