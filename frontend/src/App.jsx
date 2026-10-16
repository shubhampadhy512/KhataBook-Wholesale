// App.jsx
import { Routes, Route } from 'react-router-dom'
import {
  Login,
  MerchantLedger,
  MerchantDashboard,
  StoremanDashboard,
  MerchantPayments,
  MerchantSubmitPayment
} from './FileAddresses.jsx';
import DashboardLayout from './component/Dashboard/Dashboard.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route element={<DashboardLayout />}>
        {/* merchant pages */}
        <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
        <Route path="/merchant/ledger" element={<MerchantLedger />} />
        <Route path="/merchant/payments" element={<MerchantPayments />} />
        <Route path="/merchant/submit-payment" element={<MerchantSubmitPayment />} />

        {/* storeman pages */}
        <Route path="/storeman/dashboard" element={<StoremanDashboard />} />
        {/* <Route path="/storeman/merchants" element={<Merchants />} /> */}
      </Route>
    </Routes>
  )
}

export default App