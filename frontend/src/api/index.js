import axios from "axios";
import { LocalStorage } from "@/utils";

const ApiClient = axios.create({
	baseURL: import.meta.env.VITE_SERVER_URI,
	withCredentials: true,
	timeout: 12000,
});

ApiClient.interceptors.request.use(
	function (config) {
		const token = LocalStorage.get("token");

		config.headers.Authorization = `Bearer ${token}`;

		return config;
	},
	function (error) {
		return Promise.reject(error);
	}
);

const registerUser = (data) => {
	console.log("Registering user");
	return ApiClient.post("/users/register", data);
};

const loginUser = (data) => {
	return ApiClient.post("/users/login", data);
};

const logoutUser = () => {
	return ApiClient.post("/users/logout");
};

const forgotPassword = (email) => {
	return ApiClient.post("/users/forgot-password", { email });
};

const resetPassword = (resetToken, newPassword) => {
	return ApiClient.post(`/users/reset-password/${resetToken}`, { newPassword });
};

const getAvailableUsers = () => {
	return ApiClient.get("/chat/users");
};

const getAllChats = () => {
	return ApiClient.get("/chat");
};

const createSingleChat = (receiverId) => {
	return ApiClient.post(`/chat/c/${receiverId}`);
};

const createGroupChat = (data) => {
	return ApiClient.post("/chat/group", data);
};

const updateGroupName = (chatId, name) => {
	return ApiClient.post(`/chat/group/${chatId}`, { name });
};

const getGroupChatDetails = (chatId) => {
	return ApiClient.get(`/chat/group/${chatId}`);
};

const deleteGroupChat = (chatId) => {
	return ApiClient.delete(`/chat/group/${chatId}`);
};

const addNewParticipantInGroupChat = (chatId, participantId) => {
	return ApiClient.post(`/chat/group/${chatId}/${participantId}`);
};

const removeParticipantFromGroupChat = (chatId, participantId) => {
	return ApiClient.post(`/chat/group/${chatId}/${participantId}`);
};

const sendMessage = (chatId, content, attachments) => {
	const formData = new FormData();
	if (content) {
		formData.append("content", content);
	}
	attachments?.map((file) => {
    formData.append("attachments", file)
  });
	return ApiClient.post(`/chat/${chatId}`);
};

const deleteOneOnOneChat = (chatId) => {
	return ApiClient.delete(`/chat/remove/${chatId}`)
}

export {
	registerUser,
	loginUser,
	logoutUser,
	forgotPassword,
	resetPassword,
	getAvailableUsers,
  sendMessage,
	getAllChats,
	createSingleChat,
	createGroupChat,
	updateGroupName,
	getGroupChatDetails,
	deleteGroupChat,
	deleteOneOnOneChat,
	addNewParticipantInGroupChat,
	removeParticipantFromGroupChat,
};
