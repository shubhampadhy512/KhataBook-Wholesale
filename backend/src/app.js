const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

app.use(cors({
    orIgin:"${process.env.CORS_ORIGIN",
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded(({extended:true,limit:"16kb"})))
app.use(express.static("public"))
app.use(cookieParser())

//  import routers
const userRoute = require("./router/user.router.js")


// router declearation
app.use("/api/v1/user",userRoute)


module.exports = app;