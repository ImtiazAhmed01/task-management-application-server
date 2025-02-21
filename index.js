const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const socketIo = require('socket.io');
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
const { ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.khtuk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const server = app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
const io = socketIo(server);
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        io.on("connection", (socket) => {
            console.log("New client connected");

            socket.on("task-updated", async (task) => {
                const { id, category } = task;
                try {
                    await tasksCollection.updateOne(
                        { _id: new ObjectId(id) },
                        { $set: { category } }
                    );

                    // Broadcast updated task to all clients
                    io.emit("task-updated", task);
                } catch (error) {
                    console.error("Error updating task:", error.message);
                }
            });

            socket.on("disconnect", () => {
                console.log("Client disconnected");
            });
        });


        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        const database = client.db("taskmanagementapp");
        const usersCollection = database.collection("users");
        const tasksCollection = database.collection("tasks");
        app.post("/users", async (req, res) => {
            try {
                const { uid, email, displayName } = req.body;

                if (!uid || !email || !displayName) {
                    return res.status(400).json({ error: "Invalid user data" });
                }

                const existingUser = await usersCollection.findOne({ uid });

                if (!existingUser) {
                    const newUser = { uid, email, displayName, createdAt: new Date() };
                    await usersCollection.insertOne(newUser);
                    return res.status(201).json({ message: "User saved", user: newUser });
                }

                res.status(200).json({ message: "User already exists", user: existingUser });
            } catch (error) {
                console.error("Error saving user:", error.message);
                res.status(500).json({ error: "Internal server error" });
            }
        });
        app.get("/tasks", async (req, res) => {
            try {
                const tasks = await tasksCollection.find().toArray();
                res.json(tasks);
            } catch (error) {
                res.status(500).json({ error: "Failed to fetch tasks" });
            }
        });

        // Add a new task
        app.post("/tasks", async (req, res) => {
            try {
                const newTask = req.body;
                newTask.createdAt = new Date();
                await tasksCollection.insertOne(newTask);
                res.status(201).json(newTask);
            } catch (error) {
                res.status(500).json({ error: "Failed to add task" });
            }
        });

        // Update a task
        app.put("/tasks/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const updatedTask = req.body;
                await tasksCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedTask });
                res.json({ message: "Task updated successfully" });
            } catch (error) {
                res.status(500).json({ error: "Failed to update task" });
            }
        });

        app.put("/tasks/:id", async (req, res) => {
            const { id } = req.params;
            const { category } = req.body;
            await Task.findByIdAndUpdate(id, { category });
            res.send({ success: true });
        });

        // Delete a task
        app.delete("/tasks/:id", async (req, res) => {
            try {
                const { id } = req.params;
                await tasksCollection.deleteOne({ _id: new ObjectId(id) });
                res.json({ message: "Task deleted successfully" });
            } catch (error) {
                res.status(500).json({ error: "Failed to delete task" });
            }
        });


    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
    // finally {
    //     // // Ensures that the client will close when you finish/error
    //     // await client.close();
    // }

}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('SIMPLE CRUD IS RUNNING')
})
// app.listen(port, () => {
//     console.log(`SIMPLE crud is running on port: ${port}`)

// })
