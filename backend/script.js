require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user.js");
const app = express();

await mongoose.connect(process.env.MONGO_URL, { dbName: "KhataBook" });

app.get("/", (req, res) => {
    res.send("hello world");
});

app.get("/user", async (req, res) => {
    try {
        const newUser = await User.create({
            name: "shubham",
            email: "shubham123@gmail.com",
            phone: "938872948",
            password: "shubham",
        });
        res.send(newUser);
    } catch (error) {
        console.error("Failed to create user:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
});
const port = Number(process.env.PORT || 5000);
app.listen(port);