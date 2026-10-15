
import { Routes, Route } from 'react-router-dom'
import Login from "./component/login/login.jsx"
import MerchantDashboard from "./component/home/merchantdashboard.jsx"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/profile" element={<MerchantDashboard />} />
    </Routes>
  )
}

export default App
