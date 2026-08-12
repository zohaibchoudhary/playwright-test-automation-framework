import './App.css'
import {Routes, Route} from "react-router-dom"
import {Register, Login, ForgotPassword, ResetPassword, Chat} from "@/pages"
import {PublicRoute, PrivateRoute} from "@/components"
import { useAuth } from '@/context/AuthContext'

function App() {

  const {user, token} = useAuth()
  return (
    
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='reset-password/:resetToken' element={<ResetPassword />}/>
        <Route path='/chat' element={<Chat />} />
      </Routes>

  )
}

export default App
