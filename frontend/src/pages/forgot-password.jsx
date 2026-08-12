import React, { useState } from 'react'
import { Link } from "react-router-dom";
import { KeyIcon  } from "@heroicons/react/24/solid";
import {Input, Button} from "@/components"
import {forgotPassword} from "@/api"
import { requestHandler } from '@/utils';

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleForgotPassword = async () => {
    await requestHandler(
      async () => await forgotPassword(email),
      setLoading,
      (res) => {
        alert(res?.message)
      },
      alert
    )
  }

  return (
    <div className="flex items-center justify-center flex-col h-screen w-screen">
      <h1 className="text-3xl font-bold text-white">Chat App</h1>
			<div className="max-w-5xl w-1/2 py-8 px-6 flex justify-center items-center gap-5 flex-col bg-dark shadow-md rounded-2xl mt-10 border border-secondary">
				<h1 className="inline-flex items-center text-2xl mb-4 flex-col">
					<KeyIcon  className="h-8 w-8 mb-2" /> Forgot Password
				</h1>
				<Input 
				type='email' 
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				placeholder='Enter your email...' 
				/>
				<Button
          fullWidth
					size={"base"}
					onClick={handleForgotPassword}
					disabled={!email || loading}
        >
          Continue
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


