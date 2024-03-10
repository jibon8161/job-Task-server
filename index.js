const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { hash, compare } = require("bcrypt");
const { sign } = require("jsonwebtoken");
require("dotenv").config();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ebaxxgs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server 
    await client.connect();
    // Send a ping to confirm a successful connection
   

    app.post("/signup", async (req, res) => {
      try {
        const db = client.db("melodyverse");
        const users = db.collection("users");

        // Validate input
        const { username, email, password, name, profilePicture } = req.body;
        if (!username || !email || !password) {
          return res
            .status(400)
            .json({ error: "Username, email, and password are required" });
        }

        // Check if user already exists
        const existingUser = await users.findOne({
          $or: [{ username }, { email }],
        });
        if (existingUser) {
          return res.status(400).json({ error: "User already exists" });
        }

        // Hash password
        const hashedPassword = await hash(password, 10);

        // Insert new user into database
        const newUser = {
          username,
          email,
          password: hashedPassword,
          name,
          profilePicture,
        };
        await users.insertOne(newUser);

        // Generate JWT token
        const token = sign({ username: newUser.username }, "secret", {
          expiresIn: "1h",
        });

        // Respond with success message and token
        res.json({
          message: "Welcome! You have successfully registered.",
          token,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.post("/store-user-data", async (req, res) => {
      try {
        const { username, email, profilePicture } = req.body;

        // Get the database
        const database = client.db("melodyverse");
        const usersCollection = database.collection("users");

        // Insert user data into the collection
        const result = await usersCollection.insertOne({
          username,
          email,
          profilePicture,
        });

        console.log("Result:", result);

        // Generate JWT token
        const token = sign({ username }, "secret", {
          expiresIn: "1h",
        });
        console.log(token);
        // Respond with success message and token
        res.json({
          message: "Welcome! You have successfully registered.",
          token,
        });
      } catch (error) {
        console.error("Error storing user data:", error);
        res.status(500).json({ error: "Failed to store user data" });
      }
    });

    app.get("/posts", async (req, res) => {
      try {
        // Access the database and the collection containing users
        const db = client.db("melodyverse");
        const usersCollection = db.collection("users");

        // Query the database to get users
        const users = await usersCollection.find({}).toArray();

        // Send the users as a response
        res.json(users);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
   
  }
}
run().catch(console.dir);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
