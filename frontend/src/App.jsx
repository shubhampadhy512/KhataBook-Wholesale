
import { Routes, Route } from 'react-router-dom'
import Login from "./component/login/login.jsx"
import Profile from "./component/home/profile.jsx"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  )
}

export default App
