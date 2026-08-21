import mongoose, { Schema } from "mongoose";
import { AvailableUserRoles, UserRolesEnum, USER_TEMPORARY_TOKEN_EXPIRY } from "../../constants.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"

const userSchema = new Schema(
	{
		username: {
			type: String,
			// required: true,
			lowercase: true,
			trim: true,
		},
		email: {
			type: String,
			// required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		role: {
			type: String,
			enum: AvailableUserRoles,
			default: UserRolesEnum.USER,
			// required: true,
		},
		avatar: {
      type: String,
			default: "https://as2.ftcdn.net/v2/jpg/05/89/93/27/1000_F_589932782_vQAEAZhHnq1QCGu5ikwrYaQD0Mmurm0N.webp"
    },
		password: {
			type: String,
			// required: [true, "Password is required"],
		},
		refreshToken: {
			type: String,
		},
		// isEmailVerified: {
		// 	required: true,
		// 	default: false,
		// },
		forgotPasswordToken: {
			type: String,
		},
		forgotPasswordExpiry: {
			type: Date,
		},
		emailVerificationToken: {
			type: String,
		},
		emailVerificationExpiry: {
			type: Date,
		},
	},
	{ timestamps: true }
);

userSchema.pre("save", async function (next) {
	if(!this.isModified("password")) return next();

	this.password = await bcrypt.hash(this.password, 10)
	next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateTemporaryToken = function () {
  const unHashedToken = crypto.randomBytes(20).toString("hex");
	
	const hashedToken = crypto
	.createHash("sha256")
	.update(unHashedToken)
	.digest("hex");

  const tokenExpiry = Date.now() + USER_TEMPORARY_TOKEN_EXPIRY;

	return { hashedToken, unHashedToken, tokenExpiry }
};

export const User = mongoose.model("User", userSchema);
