const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    // "https://synergy-fit.netlify.app",
    "http://localhost:5173",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use((req, res, next) => {
  // CORS headers
  res.header(
    "Access-Control-Allow-Origin",
    "http://localhost:5173"
    // "https://synergy-fit.netlify.app",
  ); // restrict it to the required domain
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  // Set custom headers for CORS
  res.header(
    "Access-Control-Allow-Headers",
    "Content-type,Accept,X-Custom-Header"
  );
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  return next();
});

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
    const postCollection = db.collection("posts");
    const trainerCollection = db.collection("trainers");
    const gymtrainerCollection = db.collection("gymtrainers");
    const slotCollection = db.collection("slots");
    const newsltterCollection = db.collection("newsletters");
    const classCollection = db.collection("classes");
    const paymentCollection = db.collection("payments");

    //jwt
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_KEY, { expiresIn: "1h" });
      res.send({ token });
    });
    //verify Token

    // middlewares
    const verifyToken = (req, res, next) => {
      // console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      // console.log(token);
      jwt.verify(token, process.env.TOKEN_KEY, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };
    //

    //admin
    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      let member = false;
      if (user) {
        admin = user?.isAdmin === "Yes";
      }
      if (user) {
        member = user?.isAdmin === "No";
      }
      res.send({ admin, member });
    });
    app.get("/users/trainer/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await trainerCollection.findOne(query);
      let trainer = false;
      if (user) {
        trainer = user?.userRole === "Trainer";
      }
      res.send({ trainer });
    });

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
    app.get("/user", verifyToken, async (req, res) => {
      const result = await trainerCollection.find().toArray();
      res.send(result);
    });
    //gym classes
    app.post("/classes", async (req, res) => {
      const newClasses = req.body;
      const result = await classCollection.insertOne(newClasses);
      res.send(result);
    });
    app.get("/class", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    });
    app.get("/recommend-class", async (req, res) => {
      const result = await classCollection
        .find({ Tags: { $eq: "Yoga" } })
        .toArray();
      res.send(result);
    });
    //update a user role
    // app.patch('/trainer/update/:email', async (req, res) => {
    //   const email = req.params.email
    //   const user = req.body
    //   const query = { email }
    //   const updateDoc = {
    //     $set: { ...user, timestamp: Date.now() },
    //   }
    //   const result = await gymtrainerCollection.updateOne(query, updateDoc)
    //   res.send(result)
    // })

    //trainer in db
    app.post("/trainer", async (req, res) => {
      const newTrainer = req.body;
      const result = await trainerCollection.insertOne(newTrainer);
      res.send(result);
    });
    app.get("/trainer", verifyToken, async (req, res) => {
      const result = await trainerCollection.find().toArray();
      res.send(result);
    });
    //newsletter post
    app.post("/newsletter", async (req, res) => {
      const newsLetter = req.body;
      const result = await newsltterCollection.insertOne(newsLetter);
      res.send(result);
    });
    //newsletter get
    app.get("/newsletter", async (req, res) => {
      const result = await newsltterCollection.find().toArray();
      res.send(result);
    });
    app.post("/forumpost", async (req, res) => {
      const post = req.body;
      const result = await postCollection.insertOne(post);
      res.send(result);
    });
    //slot
    app.post("/slotpost", async (req, res) => {
      const slot = req.body;
      const result = await slotCollection.insertOne(slot);
      res.send(result);
    });
    app.get("/trainer-slot/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      // return console.log(email);
      const query = { email: email };
      const result = await slotCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    });
    app.get("/trainer-details/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      // return console.log(email);
      const query = { email: email };
      const result = await trainerCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    });
    // payment intent
    app.post("/create-payment-intent", verifyToken, async (req, res) => {
      const { price } = req.body;

      const amount = parseInt(price * 100);
      console.log(amount, "amount inside the intent");

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);

      res.send(paymentResult);
    });
    app.get("/payments", async (req, res) => {
      const result = await paymentCollection.find().toArray();
      res.send(result);
    });
    app.get("/post", async (req, res) => {
      const result = await postCollection.find().toArray();
      res.send(result);
    });
    app.get("/trainer/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await trainerCollection.findOne(query);
      res.send(result);
    });
    // update a trainer role
    app.patch("/trainer/update/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email };
      const updateDoc = {
        $set: { ...user, timestamp: Date.now() },
      };
      const result = await trainerCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    app.get("/trainer/:name/:email", async (req, res) => {
      const email = req.params.email;
      // return console.log(email);
      const query = { email: email };
      const result = await trainerCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    });
    app.delete("/trainer/delete/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await trainerCollection.deleteOne(query);
      res.send(result);
    });
    //
    app.get("/class-count", async (req, res) => {
      const count = await classCollection.estimatedDocumentCount();
      res.send({ count });
    });
    app.get("/classes", async (req, res) => {
      const searchTerm = req.query.term || ""; // Get search term from query parameter
      const search = req.query.search || "";
      const filter = req.query;
      const query = {
        className: { $regex: filter.search, $options: "i" },
      };
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      //  console.log("pagination query", page, size);
      const result = await classCollection
        .find(query)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });
    app.delete("/trainer-slot/delete/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await slotCollection.deleteOne(query);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
