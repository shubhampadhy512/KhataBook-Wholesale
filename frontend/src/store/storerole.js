import {configureStore } from "@reduxjs/toolkit"
import userInfo from "../features/role.js"
import { User2 } from "lucide-react"

export const store = configureStore({
    reducer:{
        user : userInfo
    }
})