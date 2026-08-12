import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/auth/user.model.js";
import crypto from "crypto";

import {
	sendEmail,
	emailVerificationMailgenContent,
	forgotPasswordMailgenContent,
} from "../../utils/mail.js";

const generateAccessAndRefreshTokens = async (userId) => {
	try {
		const user = await User.findById(userId);

		const accessToken = user.generateAccessToken();
		const refreshToken = user.generateRefreshToken();

		user.refreshToken = refreshToken;

		await user.save({ validateBeforeSave: false });

		return { accessToken, refreshToken };
	} catch (error) {
		throw new ApiError(
			500,
			"Something went wrong while generating the access and refresh tokens"
		);
	}
};

const registerUser = asyncHandler(async (req, res) => {
	const { username, email, password } = req.body;

	const existedUser = await User.findOne({
		$or: [{ username }, { email }],
	});

	if (existedUser) {
		throw new ApiError(409, "User with email or username already exists", []);
	}
	const user = await User.create({
		username,
		email,
		password,
		isEmailVerified: false,
	});

	const createdUser = await User.findById(user._id).select(
		"-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
	);

	if (!createdUser) {
		throw new ApiError(500, "Something went wrong while registering the user");
	}

	return res
		.status(201)
		.json(
			new ApiResponse(
				200,
				{ user: createdUser },
				"User registered successfully and verification email has been sent on your email."
			)
		);
});

const loginUser = asyncHandler(async (req, res) => {
	const { email, password } = req.body;

	if (!email && !password) {
		throw new ApiError(400, "Email is required");
	}

	const user = await User.findOne({ email });

	if (!user) {
		throw new ApiError(404, "User does not exist");
	}

	const isPasswordvalid = await user.isPasswordCorrect(password);

	if (!isPasswordvalid) {
		throw new ApiError(404, "Invalid user credentials");
	}

	const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
		user._id
	);

	const loggedInUser = await User.findById(user._id).select(
		"-password -refreshToken -emailVerificationToken, -forgotPasswordToken"
	);

	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.cookie("accessToken", accessToken, options)
		.cookie("refreshToken", refreshToken, options)
		.json(
			new ApiResponse(
				200,
				{ user: loggedInUser, accessToken, refreshToken },
				"User logged in successfully"
			)
		);
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
	const {email} = req.body;

	const user = await User.findOne({ email });
	
	if (!user) {
		throw new ApiError(404, "User does not exist");
	}

	const { hashedToken, unHashedToken, tokenExpiry } =
		await user.generateTemporaryToken();

	user.forgotPasswordToken = hashedToken;
	user.forgotPasswordExpiry = tokenExpiry;

	await user.save({ validateBeforeSave: false });

	await sendEmail({
		email: user.email,
		subject: "Password reset request",
		mailgenContent: forgotPasswordMailgenContent(
			user.username,
			`${process.env.FORGOT_PASSWORD_RESET_URL}/${unHashedToken}`
		),
	});

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{},
				"Password reset mail has been sent to your email"
			)
		);
});

const passwordResetRequest = asyncHandler(async (req, res) => {
	const { resetToken } = req.params;
	const { newPassword } = req.body;
	
	const hashedToken = crypto
		.createHash("sha256")
		.update(resetToken)
		.digest("hex");

	const user = await User.findOne({
		forgotPasswordToken: hashedToken,
		forgotPasswordExpiry: { $gt: Date.now() },
	});

	if (!user) {
		throw new ApiError(489, "Token is invalid or expired")
	}

	user.forgotPasswordToken = undefined;
	user.forgotPasswordExpiry = undefined;

	user.password = newPassword

	await user.save({validateBeforeSave: false})

	return res
	.status(200)
	.json(
		new ApiResponse(200, {}, "Password reset successfully")
	)
});


export { 
	registerUser, 
	loginUser, 
	forgotPasswordRequest, 
	passwordResetRequest,
};
