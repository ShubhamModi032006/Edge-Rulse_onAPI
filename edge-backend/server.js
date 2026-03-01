import { connectDB } from "./config/db.js";
import redis from "./config/redis.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`http://localhost:${PORT}`);
    });
};



startServer();

await redis.ping();
