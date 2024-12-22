const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://job-portal-cd467.web.app",
            "https://job-portal-cd467.firebaseapp.com",
        ],
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

const logger = (req, res, next) => {
    console.log("Logging route:", req.path, new Date().toISOString());
    next();
};

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: "Access Denied, Unauthorized" });
    }
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Invalid token" });
        }
        req.user = decoded;
    });
    next();
};

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};
// localhost:5000 and localhost:5173 are treated as same site.
// so sameSite value must be strict in development server.
// in production sameSite will be none
// in development server secure will false .
// in production secure will be true

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fh7he.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );

        // job collection
        const jobsCollection = client.db("jobPortal").collection("jobs");
        // job applications collection
        const jobApplicationsCollection = client
            .db("jobPortal")
            .collection("job-applications");

        /**
         *
         * Auth apis
         *
         */
        // Creating token
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_SECRET_KEY, {
                expiresIn: "10d",
            });
            res.cookie("token", token, cookieOptions).send({ success: true });
        });

        // clearing Token
        app.post("/logout", async (req, res) => {
            // const user = req.body;
            // console.log("logging out", user);
            res.clearCookie("token", { ...cookieOptions, maxAge: 0 }).send({
                success: true,
            });
        });

        /**
         *
         * job apis
         *
         */
        // get all jobs
        app.get("/jobs", logger, async (req, res) => {
            const email = req.query.email;
            let query = {};

            if (email) {
                query = { hr_email: email };
            }
            const cursor = jobsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // get job by id
        app.get("/jobs/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.findOne(query);
            res.send(result);
        });

        // add job
        app.post("/jobs", async (req, res) => {
            const job = req.body;
            const result = await jobsCollection.insertOne(job);
            res.json(result);
        });

        // delete job by id
        app.delete("/jobs/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.deleteOne(query);
            res.json(result);
        });

        /**
         *
         * job application apis
         *
         */
        // get job applications by email
        app.get("/job-applications", verifyToken, async (req, res) => {
            const email = req.query.email;
            const query = { application_email: email };
            // console.log("cookies: ", req.cookies?.token);
            //* check if the user is trying to access other user's data
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: "Forbidden Acceess" });
            }

            const result = await jobApplicationsCollection
                .find(query)
                .toArray();

            // aggregate data from jobs collection
            for (const application of result) {
                // console.log(application.job_id);
                const queryResult = { _id: new ObjectId(application.job_id) };
                const job = await jobsCollection.findOne(queryResult);
                if (job) {
                    application.title = job.title;
                    application.company = job.company;
                    application.company_logo = job.company_logo;
                    application.jobType = job.jobType;
                    application.location = job.location;
                    application.category = job.category;
                }
            }
            res.send(result);
        });

        // delete job application by id
        app.delete("/job-applications/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobApplicationsCollection.deleteOne(query);
            res.json(result);
        });

        // get job applications by job id
        app.get("/job-applications/jobs/:job_id", async (req, res) => {
            const jobId = req.params.job_id;
            const query = { job_id: jobId };
            const result = await jobApplicationsCollection
                .find(query)
                .toArray();
            res.send(result);
        });

        // create job application
        app.post("/job-applications", async (req, res) => {
            const application = req.body;
            const result = await jobApplicationsCollection.insertOne(
                application
            );
            res.json(result);
        });

        // update job application status
        app.patch("/job-applications/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const data = req.body;
            const updateDoc = {
                $set: {
                    status: data.status,
                },
            };

            const result = await jobApplicationsCollection.updateOne(
                filter,
                updateDoc
            );
            res.json(result);
        });
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Job Portal is running...");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
