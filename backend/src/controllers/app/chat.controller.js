import mongoose from "mongoose";
import { User } from "../../models/auth/user.model.js";
import { Chat } from "../../models/app/chat.model.js";
import { ChatMessage } from "../../models/app/message.model.js";
import { ChatEventEnum } from "../../constants.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
// import { removeLocalFile } from "../../utils/helpers.js";
import { emitSocketEvent } from "../../socket/index.js";

const deleteCascadeChatMessages = async (chatId) => {
	const messages = await ChatMessage.find({
		chat: new mongoose.Types.ObjectId(chatId)
	})

	let attachments = []

	attachments = attachments.concat(
		...messages.map((message) => {
			return message.attachments;
		})
	)

	await ChatMessage.deleteMany({
		chat: new mongoose.Types.ObjectId(chatId)
	})
}

const chatCommonAggregation = () => {
	return [
		{
			$lookup: {
				from: "users",
				localField: "participants",
				foreignField: "_id",
				as: "participants",
				pipeline: [
					{
						$project: {
							password: 0,
							refreshToken: 0,
							forgotPasswordToken: 0,
							forgotPasswordExpiry: 0,
							emailVerificationToken: 0,
							emailVerificationExpiry: 0,
						},
					},
				],
			},
		},
		{
			$lookup: {
				from: "chatmessages",
				localField: "lastMessage",
				foreignField: "_id",
				as: "lastMessage",
				pipeline: [
					{
						$lookup: {
							from: "users",
							foreignField: "_id",
							localField: "sender",
							as: "sender",
							pipeline: [
								{
									$project: {
										username: 1,
										avatar: 1,
										email: 1,
									},
								},
							],
						},
					},
					{
						$addFields: {
							sender: {
								$first: "$sender",
							},
						},
					},
				],
			},
		},
		{
			$addFields: {
				lastMessage: {
					$first: "$lastMessage",
				},
			},
		},
	];
};

const searchAvailableUsers = asyncHandler(async (req, res) => {
	const users = await User.aggregate([
		{
			$match: {
				_id: {
					$ne: req.user?._id,
				},
			},
		},
		{
			$project: {
				username: 1,
				email: 1,
				avatar: 1,
			},
		},
	]);

	return res
		.status(200)
		.json(new ApiResponse(200, users, "Users fetched successfully"));
});

const createOrGetAOneOnOneChat = asyncHandler(async (req, res) => {
	const { receiverId } = req.params;

	const receiver = await User.findById(receiverId);

	if (!receiver) {
		throw new ApiError(404, "Receiver does not exists");
	}

	// check if receiver is not the user who is requesting a chat
	if (receiver?._id.toString() === req.user._id.toString()) {
		throw new ApiError(400, "You cannot chat with yourself");
	}

	const chat = await Chat.aggregate([
		{
			$match: {
				isGroupChat: false,
				$and: [
					{
						participants: { $elemMatch: { $eq: req.user._id } },
					},
					{
						participants: {
							$elemMatch: { $eq: new mongoose.Types.ObjectId(receiverId) },
						},
					},
				],
			},
		},
		...chatCommonAggregation(),
	]);	

	if (chat.length) {
		return res
			.status(200)
			.json(new ApiResponse(200, chat[0], "Chat retreived successfully"));
	}

	const newChatInstance = await Chat.create({
		name: "One on one chat",
		participants: [req.user._id, new mongoose.Types.ObjectId(receiverId)],
		admin: req.user._id,
	});

	const createdChat = await Chat.aggregate([
		{
			$match: {
				_id: newChatInstance._id,
			},
		},
		...chatCommonAggregation(),
	]);

	const payload = createdChat[0];

	if (!payload) {
		throw new ApiError(500, "Internal server error");
	}

	payload?.participants?.forEach((participant) => {
		if (participant._id.toString() === req.user._id.toString()) {
			return;
		}

		emitSocketEvent(
			req,
			participant._id.toString(),
			ChatEventEnum.NEW_CHAT_EVENT,
			payload
		);
	});

	return res
		.status(201)
		.json(new ApiResponse(201, payload, "Chat retreived successfully"));
});

const createAGroupChat = asyncHandler(async (req, res) => {
	const { name, participants } = req.body;

	if (participants.includes(req.user._id.toString())) {
		throw new ApiError(
			400,
			"Participants array should not contain the group creator"
		);
	}

	const members = [...new Set([...participants, req.user._id.toString()])];

	if (members.length < 3) {
		throw new ApiError(
			400,
			"Seems like you have passed duplicate participants"
		)
	}
	const groupChat = await Chat.create({
		name,
		isGroupChat: true,
		participants: members,
		admin: req.user._id,
	});

	const chat = await Chat.aggregate([
		{
			$match: {
				_id: groupChat._id,
			},
		},
		...chatCommonAggregation(),
	]);

	const payload = chat[0];

	if (!payload) {
		throw new ApiError(500, "Internal server error");
	}

	payload?.participants?.forEach((participant) => {
		if (participant._id.toString() === req.user._id.toString()) {
			return;
		}

		emitSocketEvent(
			req,
			participant._id.toString(),
			ChatEventEnum.NEW_CHAT_EVENT,
			payload
		);
	});

	return res
		.status(201)
		.json(new ApiResponse(201, payload, "Group chat created successfully"));
});

const getGroupChatDetails = asyncHandler(async (req, res) => {
	const { chatId } = req.params;

	const groupChat = await Chat.aggregate([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(chatId),
				isGroupChat: true,
			},
		},
		...chatCommonAggregation(),
	]);

	const chat = groupChat[0];

	if (!chat) {
		throw new ApiError(404, "Group chat does not exist");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, chat, "Group chat fetched successfully"));
});

const renameGroupChat = asyncHandler(async (req, res) => {
	const { chatId } = req.params;
	const { name } = req.body;

	const groupChat = await Chat.findOne({
		_id: new mongoose.Types.ObjectId(chatId),
		isGroupChat: true,
	});

	if (!groupChat) {
		throw new ApiError(404, "Group chat does not exist");
	}

	if (groupChat?.admin.toString() !== req.user._id.toString()) {
		throw new ApiError(404, "You are not an admin");
	}

	const updatedGroupChat = await Chat.findByIdAndUpdate(
		chatId,
		{
			name,
		},
		{
			new: true,
		}
	);

	const chat = await Chat.aggregate([
		{
			$match: {
				_id: updatedGroupChat._id,
			},
		},
		...chatCommonAggregation(),
	]);

	const payload = chat[0];

	if (!payload) {
		throw new ApiError(500, "Internal Server Error");
	}

	payload?.participants?.forEach((participant) => {
		emitSocketEvent(
			req,
			participant._id.toString(),
			ChatEventEnum.UPDATE_GROUP_NAME_EVENT,
			payload
		);
	});

	return res
		.status(200)
		.json(
			new ApiResponse(200, payload, "Group chat name updated successfully")
		);
});

const addNewParticipantInGroupChat = asyncHandler(async (req, res) => {
	const { chatId, participantId } = req.params;

	const groupChat = await Chat.findOne({
		_id: new mongoose.Types.ObjectId(chatId),
		isGroupChat: true,
	});

	if (!groupChat) {
		throw new ApiError(404, "Group chat does not exist");
	}

	if (groupChat?.admin.toString() !== req.user._id.toString()) {
		throw new ApiError(404, "You are not an admin");
	}

	const existingParticipants = groupChat.participants;

	if (existingParticipants?.includes(participantId)) {
		throw new ApiError(409, "Participant already in a group chat");
	}

	const updatedChat = await Chat.findByIdAndUpdate(
		chatId,
		{
			$push: {
				participants: participantId,
			},
		},
		{
			new: true,
		}
	);

	const chat = await Chat.aggregate([
		{
			$match: {
				_id: updatedChat._id,
			},
		},
		...chatCommonAggregation(),
	]);

	const payload = chat[0];
	
	if (!payload) {
		throw new ApiError(500, "Internal server error");
	}
	
	emitSocketEvent(req, participantId, ChatEventEnum.NEW_CHAT_EVENT, payload);
	
	return res
	.status(200)
	.json(
		new ApiResponse(
			200, payload, "Participant added successfully"
		)
	);
});

const removeParticipantFromGroupChat = asyncHandler(async (req, res) => {
	const { chatId, participantId } = req.params;

	const groupChat = await Chat.findOne({
		_id: new mongoose.Types.ObjectId(chatId),
		isGroupChat: true,
	});

	if (!groupChat) {
		throw new ApiError(404, "Group chat does not exist");
	}

	if (groupChat?.admin.toString() !== req.user._id.toString()) {
		throw new ApiError(404, "You are not an admin");
	}

	const existingParticipants = groupChat.participants;

	if (!existingParticipants?.includes(participantId)) {
		throw new ApiError(400, "Participant does not exist in the group chat");
	}

	const updatedChat = await Chat.findByIdAndUpdate(
		chatId,
		{
			$pull: {
				participants: participantId
			}
		},
		{
			new: true
		}
	)

	const chat = await Chat.aggregate([
		{
			$match: {
				_id: updatedChat._id
			}
		},
		...chatCommonAggregation()
	])

	const payload = chat[0]

	if (!payload) {
    throw new ApiError(500, "Internal server error");
  }

	emitSocketEvent(
		req,
		participantId,
		ChatEventEnum.LEAVE_CHAT_EVENT,
		payload
	)

	return res
	.status(200)
	.json(
		new ApiResponse(200, payload, "Participant removed successfully")
	)

});

const leaveGroupChat = asyncHandler(async (req, res) => {
	const { chatId } = req.params;
	const groupChat = await Chat.findOne({
		_id: new mongoose.Types.ObjectId(chatId),
		isGroupChat: true,
	});

	if (!groupChat) {
		throw new ApiError(404, "Group chat does not exist");
	}

	const existingParticipants = groupChat.participants;

	if (!existingParticipants?.includes(req.user._id)) {
		throw new ApiError(400, "You are not a part of this group chat");
	}

	const updatedChat = await Chat.findByIdAndUpdate(
		chatId,
		{
			$pull: {
				participants: req.user._id,
			},
		},
		{
			new: true,
		}
	);

	const chat = await Chat.aggregate([
		{
			$match: {
				_id: updatedChat._id,
			},
		},
		...chatCommonAggregation(),
	]);

	const payload = chat[0];

	if (!payload) {
		throw new ApiError(500, "Internal server error");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, payload, "Left a group successfully"));
});

const deleteOneOnOneChat = asyncHandler(async (req, res) => {
	const {chatId} = req.params;

	const chat = await Chat.aggregate([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(chatId)
			}
		},
		...chatCommonAggregation()
	])

	const payload = chat[0]

	if (!payload) {
		throw new ApiError(404, "Chat does not exist")
	}

	await Chat.findByIdAndDelete(chatId)

	await deleteCascadeChatMessages(chatId)

	const otherParticipant = payload?.participants?.find(
		(participant) => participant._id.toString() !== req.user._id.toString()
	)

	emitSocketEvent(
		req,
		otherParticipant._id.toString(),
		ChatEventEnum.LEAVE_CHAT_EVENT,
		payload
	)

	return res
	.status(200)
	.json(
		new ApiResponse(200, {}, "Chat deleted successfully")
	)
})

const deleteGroupChat = asyncHandler(async (req, res) => {
	const {chatId} = req.params;

	const groupChat = await Chat.aggregate([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(chatId),
				isGroupChat: true
			}
		},
		...chatCommonAggregation()
	])

	const payload = groupChat[0]

	if (!payload) {
		throw new ApiError(404, "Group chat does not exist")
	}

	if (payload?.admin.toString() !== req.user._id.toString()) {
		throw new ApiError(400, "Only admin can delete the group")
	}

	await Chat.findByIdAndDelete(chatId)

	await deleteCascadeChatMessages(chatId)

	payload.participants.forEach((participant) => {
		if (participant._id.toString() === req.user._id.toString()) {
			return;
		}

		emitSocketEvent(
			req,
			participant._id.toString(),
			ChatEventEnum.LEAVE_CHAT_EVENT,
			payload
		)
	})

	return res
	.status(200)
	.json(
		new ApiResponse(
			200, {}, "Group chat deleted successfully"
		)
	)

})

const getAllChats = asyncHandler(async (req, res) => {
	const chats = await Chat.aggregate([
		{
			$match: {
				participants: { $elemMatch: { $eq: req.user._id } },
			},
		},
		{
			$sort: {
				updatedAt: -1,
			},
		},
		...chatCommonAggregation(),
	]);

	return res
		.status(200)
		.json(new ApiResponse(200, chats || [], "Chat fetched successfully"));
});

export {
	searchAvailableUsers,
	createOrGetAOneOnOneChat,
	createAGroupChat,
	getGroupChatDetails,
	renameGroupChat,
	addNewParticipantInGroupChat,
	removeParticipantFromGroupChat,
	leaveGroupChat,
	deleteOneOnOneChat,
	deleteGroupChat,
	getAllChats,
};
