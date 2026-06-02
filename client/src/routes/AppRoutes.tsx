import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from '../features/home/HomePage'
// import RegisterPage from '../features/auth/RegisterPage'
import LoginPage from '../features/auth/LoginPage'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* <Route path="/register" element={<RegisterPage />} /> */}
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  )
}