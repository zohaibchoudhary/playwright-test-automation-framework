import { useState } from 'react'
import { resetPassword } from '@/api'
import { requestHandler } from '@/utils'
import { Input, Button } from '@/components';
import { Link } from "react-router-dom";
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { KeyIcon  } from "@heroicons/react/24/solid";

export default function ResetPassword() {

  const {resetToken} = useParams()
  
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState()

  const navigate = useNavigate()

  const handleResetPassword = async () => {
    await requestHandler(
      async () => await resetPassword(resetToken, newPassword),
      setLoading,
      (res) => {
        alert(res?.message)
        navigate('/chat')
      },
      alert
    )
  }
  return (
    <div className="flex items-center justify-center flex-col h-screen w-screen">
      <h1 className="text-3xl font-bold text-white">Chat App</h1>
			<div className="max-w-5xl w-1/2 py-8 px-6 flex justify-center items-center gap-5 flex-col bg-dark shadow-md rounded-2xl mt-10 border border-secondary">
				<h1 className="inline-flex items-center text-2xl mb-4 flex-col text-white">
					<KeyIcon className="h-8 w-8 mb-2 text-white" /> Reset Password
				</h1>
				<Input 
				type='password'
				value={newPassword}
				onChange={(e) => setNewPassword(e.target.value)} 
				placeholder='Enter new password...' 
				/>
				<Button
          fullWidth
					size={"base"}
					onClick={handleResetPassword}
					disabled={!newPassword || loading}
        >
          Reset
        </Button>
				<small className="text-zinc-300">
        Remembered your password?{" "}
					<Link to="/" className="text-blue-500 hover:underline">
						Login
					</Link>
				</small>
			</div>
		</div>
  )
}
