const express = require("express");
const app = express();
const cors = require("cors");
// const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ["https://wandering-fork.netlify.app", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_KEY}@cluster0.qkr0gnw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const userCollection = client.db("fitness-app").collection("users");

    //
    app.post("/user", async (req, res) => {
      const newUser = req.body;
      const query = { email: newUser?.email };
      let isExist = await userCollection.findOne(query);
      if (isExist) {
        return res.send({ message: "user already exist", indsertedId: null });
      }
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //     await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("fitness server is running");
});

app.listen(port, () => {
  console.log("fitness server runnning ---",port);
});
