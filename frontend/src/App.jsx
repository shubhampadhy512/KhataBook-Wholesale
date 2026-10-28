// App.jsx
import { Routes, Route } from 'react-router-dom'
import {
  Login,
  MerchantDashboard,
  StoremanDashboard,
  MerchantPayments,
  MerchantSubmitPayment,
  AddHistory,
  ForgotPassword,
  MerchantsDetails,
  DailyHistory,
  RecordPayment,
  MerchantBalances,
  StoremanVerification,
  StoreDetails,
  ProductManager
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
        <Route path="/merchant/payments" element={<MerchantPayments />} />
        <Route path="/merchant/submit-payment" element={<MerchantSubmitPayment />} />
        <Route path="/merchant/daily-history" element={<DailyHistory />} />
        <Route path="/merchant/Mystore" element={<StoreDetails />} />

        {/* storeman pages */}
        <Route path="/storeman/dashboard" element={<StoremanDashboard />} />
        <Route path="/storeman/merchants" element={<MerchantsDetails />} />
        <Route path="/storeman/addhistory" element={<AddHistory />} />
        <Route path="/storeman/daily-history" element={<DailyHistory />} />
        <Route path="/storeman/addrecord-payment" element={<RecordPayment />} />
        <Route path="/storeman/merchantbalances" element={<MerchantBalances />} />
        <Route path="/storeman/verifypayment" element={<StoremanVerification />} />
        <Route path="/storeman/getallproducts" element={<ProductManager />} />
      </Route>
    </Routes>
  )
}

export default App