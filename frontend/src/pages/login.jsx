import React, { useState } from 'react'
import { Link } from "react-router-dom";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import {Input, Button} from "@/components"
import { useAuth } from '@/context/AuthContext';

export default function Login() {
	const [data, setData] = useState({
		email: "",
		password: ""
	})
	
	const {login} = useAuth()

	const handleDataChange = (name) => (e) => {
		setData({
		...data,
		[name]: e.target.value
		})
	}

	const handleLogin = async () => await login(data)

  return (
    <div className="flex items-center justify-center flex-col h-screen w-screen">
      <h1 className="text-3xl font-bold text-white">Chat App</h1>
			<div className="max-w-5xl w-1/2 py-8 px-6 flex justify-center items-center gap-5 flex-col bg-dark shadow-md rounded-2xl mt-10 border border-secondary">
				<h1 className="inline-flex items-center text-2xl mb-4 flex-col text-white">
					<LockClosedIcon className="h-8 w-8 mb-2 text-white" /> Login
				</h1>
				<Input 
				type='email' 
				value={data.email}
				onChange={handleDataChange('email')}
				placeholder='Enter your email...' 
				/>
				<Input 
				type='password'
				value={data.password}
				onChange={handleDataChange('password')} 
				placeholder='Enter your password...' 
				/>
				<Link 
				to='/forgot-password'
				className='ml-auto text-zinc-200 hover:underline hover:underline-offset-2'>
				forgot password?
				</Link>
				<Button
          fullWidth
					size={"base"}
					onClick={handleLogin}
					disabled={Object.values(data).some(val => !val)}
        >
          Login
        </Button>
				<small className="text-zinc-300">
					Don&apos;t have an account?{" "}
					<Link to="/register" className="text-blue-500 hover:underline">
						Register
					</Link>
				</small>
			</div>
		</div>
  )
}
