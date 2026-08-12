import React, { useEffect, useState } from "react";
import { Input, Button, Select } from "@/components";
// import { Button, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { requestHandler } from "@/utils";
import { createGroupChat, createSingleChat, getAvailableUsers } from "@/api";

export default function AddChatModal() {
	const [users, setUsers] = useState([]);
	const [groupName, setGroupName] = useState("");
	const [isGroupChat, setIsGroupChat] = useState(false);
	const [groupParticipants, setGroupParticipants] = useState([]);
	const [selectedUserId, setSelectedUserId] = useState(null);
	const [creatingChat, setCreatingChat] = useState(false);

	let [isOpen, setIsOpen] = useState(false);

	function open() {
		setIsOpen(true);
	}

	function close() {
		setIsOpen(false);
	}

	const getUsers = async () => {
		requestHandler(
			async () => await getAvailableUsers(),
			null,
			(res) => {
				const { data } = res;
				setUsers(data || []);
			},
			alert
		);
	};

	const createNewChat = async () => {
		console.log(selectedUserId);
		if (!selectedUserId) return alert("Please provide user ID");
		requestHandler(
			async () => await createSingleChat(selectedUserId),
			creatingChat,
			(res) => {
				const { data } = res;
				if (res.statusCode === 201) {
					alert(res.message);
				} else {
					alert("Chat with user already exists");
				}
			},
			alert
		);
	};

	const createNewGroupChat = async () => {
		if (!groupName) return alert("Group name is required");

		if (!groupParticipants.length || !groupParticipants.length > 2)
			return alert("There must be atleast 2 group participants");
		requestHandler(
			async () =>
				await createGroupChat({
					name: groupName,
					participants: groupParticipants,
				}),
			creatingChat,
			(res) => {
				const { data } = res;
				alert("Group chat created successfully");
			},
			alert
		);
	};

	return (
		<div>
			<Input
				className="w-56"
				value={selectedUserId}
				onChange={(e) => setSelectedUserId(e.target.value)}
			/>
			<Button onClick={createNewChat}>Create</Button>
		</div>
	);
}
