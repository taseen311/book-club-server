
import { MongoClient } from 'mongodb';
import express from 'express'
// const cors = require("cors");
import cors from 'cors'
import 'dotenv/config'
const app = express();
const PORT = 8000

// Middleware
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_DB_URI);
export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.dir(err);
    }
}

connectToMongoDB();

// async function startServer() {
//     try {
//         await connectToMongoDB();

//         app.listen(PORT, () => {
//             console.log(`BookNook Server is running on port ${PORT}`);
//         });
//     } catch (error) {
//         console.error("Failed to start server.");
//         process.exit(1);
//     }
// }



// Root route
app.get("/", (req, res) => {
    res.send("BookNook Server is Running!");
});

// Start Server
app.listen(PORT, () => {
    console.log(`BookNook Server is running on port ${PORT}`);
});
