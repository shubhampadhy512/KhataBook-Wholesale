require("dotenv").config();

const express = require("express");
const app = require("./app.js");
const User = require("./models/user.js");
const connectMongoose = require("./db/connectdb.js");

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


connectMongoose()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.group(`Server is running on port ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        console.log("MongoDB connnection in app.js Error", err);
    });