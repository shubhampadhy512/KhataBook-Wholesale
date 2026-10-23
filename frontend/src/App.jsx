// App.jsx
import { Routes, Route } from 'react-router-dom'
import {
  Login,
  MerchantLedger,
  MerchantDashboard,
  StoremanDashboard,
  MerchantPayments,
  MerchantSubmitPayment,
  AddHistory,
  ForgotPassword,
  MerchantsDetails,
  DailyHistory,
  RecordPayment
} from './FileAddresses.jsx';
import DashboardLayout from './component/Dashboard/Dashboard.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<DashboardLayout />}>

        {/* merchant pages */}
        <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
        <Route path="/merchant/ledger" element={<MerchantLedger />} />
        <Route path="/merchant/payments" element={<MerchantPayments />} />
        <Route path="/merchant/submit-payment" element={<MerchantSubmitPayment />} />
        <Route path="/merchant/daily-history" element={<DailyHistory />} />

        {/* storeman pages */}
        <Route path="/storeman/dashboard" element={<StoremanDashboard />} />
        <Route path="/storeman/merchants" element={<MerchantsDetails />} />
        <Route path="/storeman/addhistory" element={<AddHistory />} />
        <Route path="/storeman/daily-history" element={<DailyHistory />} />
        <Route path="/storeman/addrecord-payment" element={<RecordPayment />} />
      </Route>
    </Routes>
  )
}

export default App