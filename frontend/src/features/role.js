import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    username: null,
    email: null,
    addresses: null,
    phone: null,
    role: null,
};

export const User = createSlice({
    name: "userinfo",
    initialState,
    reducers: {
        UserInfo: (state, action) => {
            state.username = action.payload.username;
            state.email = action.payload.eamil;
            state.phone = action.payload.phone;
            state.addresses = action.addresses;
            state.role = action.payload.role;
        },
        resetRole: (state) => {
            Object.keys(state).forEach((key) => {
                state[key] = null;
            })
        }
    }
})

export const { UserInfo, resetRole } = User.actions;

export default User.reducer;