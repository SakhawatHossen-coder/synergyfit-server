const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ["https://wandering-fork.netlify.app", "http://localhost:5173"],
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
    const db = client.db("fitness-app");
    const userCollection = db.collection("users");
    const trainerCollection = db.collection("trainers");
    //jwt
    app.post("/jwt", async (req, res) => {
      let user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_KEY, { expiresIn: "1h" });
      res.send({ token });
    });
    //verify Token
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unauthorize Access!" });
      }
      let token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.TOKEN_KEY, (err, decode) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorize Access!" });
        }
        req.decode;
        next();
      });
    };
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
    //trainer in db
    app.post("/trainer", async (req, res) => {
      const newTrainer = req.body;
      const result = await trainerCollection.insertOne(newTrainer);
      res.send(result);
    });
    app.get("/trainer", async (req, res) => {
      const result = await trainerCollection.find().toArray();
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
  console.log("fitness server runnning ---", port);
});
