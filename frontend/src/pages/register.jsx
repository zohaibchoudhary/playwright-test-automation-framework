import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import {Input, Button} from "@/components"
import { useAuth } from "@/context/AuthContext";

export default function Register() {

	const [data, setData] = useState({
		username: "",
		email: "", 
		password: "",
	})

	const {register} = useAuth()

	const handleDataChange = (name) => (e) => {
		setData({
			...data,
			[name]: e.target.value
		})
	}

	const handleRegister = async() => await register(data)


	return (
		<div className="flex justify-center items-center flex-col h-screen w-screen">
      <h1 className="text-3xl font-bold text-white">Chat App</h1>
			<div className="max-w-5xl w-1/2 py-8 px-6 flex justify-center items-center gap-5 flex-col bg-dark shadow-md rounded-2xl mt-10 border border-secondary">
				<h1 className="inline-flex items-center text-2xl mb-4 flex-col text-white">
					<LockClosedIcon className="h-8 w-8 mb-2 text-white" /> Register
				</h1>
				<Input 
				type='text'
				placeholder='Enter your username...'
				value={data.username}
				onChange={handleDataChange("username")}
				/>
				<Input type='email' 
				placeholder='Enter your email...'
				value={data.email}
				onChange={handleDataChange("email")}
				/>
				<Input 
				type='password' 
				placeholder='Enter your password...'
				value={data.password}
				onChange={handleDataChange("password")}
				/>
				<Button
          fullWidth
					size={"base"}
					onClick={handleRegister}
					disabled={Object.values(data).some(val => !val)}
        >
          Register
        </Button>
				<small className="text-zinc-300">
					Already have an account?{" "}
					<Link to="/" className="text-blue-500 hover:underline">
						Login
					</Link>
				</small>
			</div>
		</div>
	);
}
