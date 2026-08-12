import mongoose from "mongoose";
import { Chat } from "../../models/app/chat.model.js";
import { ChatMessage } from "../../models/app/message.model.js";
import { ChatEventEnum } from "../../constants.js";
import { emitSocketEvent } from "../../socket/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
// import { getLocalPath, getStaticFilePath } from "../../utils/helpers.js";

const chatMessageCommonAggregation = () => {
	return [
		{
			$lookup: {
				from: "users",
				localField: "sender",
				foreignField: "_id",
				as: "sender",
				pipeline: [
					{
						$project: {
							username: 1,
							email: 1,
							avatar: 1,
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
	];
};

const getAllMessages = asyncHandler(async (req, res) => {
	const { chatId } = req.params;

	const selectedChat = await Chat.findById(chatId);

	if (!selectedChat) {
		throw new ApiError(404, "Chat does not exist");
	}

	if (!selectedChat.participants?.includes(req.user._id)) {
		throw new ApiError(400, "You are not a part of this chat");
	}

	const messages = await ChatMessage.aggregate([
		{
			$match: {
				chat: new mongoose.Types.ObjectId(chatId),
			},
		},
		{
			$sort: {
				createdAt: -1,
			},
		},
		...chatMessageCommonAggregation(),
	]);

	return res
		.status(200)
		.json(
			new ApiResponse(200, messages || [], "Messages fetched successfully")
		);
});

const sendMessage = asyncHandler(async (req, res) => {
	const { chatId } = req.params;
	const { content } = req.body;

	if (!content && !req.files?.attachments?.length) {
		throw new ApiError(400, "Message content or attachment is required");
	}

	const selectedChat = await Chat.findById(chatId);

	if (!selectedChat) {
		throw new ApiError(404, "Chat does not exist");
	}

	let messagefiles = [];
	for (const attachment of req.files.attachments) {
		const response = await uploadOnCloudinary(attachment.path);

		if (!response) {
			throw new ApiError(500, "failed to uplaod image");
		}

		messagefiles.push({
			url: response.url,
		});
	}

	const message = await ChatMessage.create({
		sender: new mongoose.Types.ObjectId(req.user._id),
		content: content || "",
		attachments: messagefiles,
		chat: new mongoose.Types.ObjectId(chatId),
	});

	const chat = await Chat.findByIdAndUpdate(
		chatId,
		{
			$set: {
				lastMessage: message._id,
			},
		},
		{
			new: true,
		}
	);

	const messages = await ChatMessage.aggregate([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(message._id),
			},
		},
		...chatMessageCommonAggregation(),
	]);

	const receivedMessage = messages[0];

	if (!receivedMessage) {
		throw new ApiError(500, "Internal server error");
	}

	chat?.participants?.forEach((participant) => {
		if (participant._id.toString() === req.user._id.toString()) {
			return;
		}

		emitSocketEvent(
			req,
			participant._id.toString(),
			ChatEventEnum.MESSAGE_RECEIVED_EVENT,
			receivedMessage
		);
	});

	return res
		.status(201)
		.json(new ApiResponse(201, receivedMessage, "Message sent successfully"));
});

const deleteMessage = asyncHandler(async (req, res) => {
	const {chatId, messageId} = req.params;

	const selectedChat = await Chat.findById(chatId)

	if (!selectedChat) {
		throw new ApiError(400, "Chat does not exist")
	}

	const message = await ChatMessage.findById(messageId)

	ChatMessage.aggregate()


	await ChatMessage.deleteOne({
		_id: message._id
	})


})

export { sendMessage, getAllMessages };
