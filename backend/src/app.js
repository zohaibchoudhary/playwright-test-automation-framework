import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import requestIp from "request-ip"
import {rateLimit} from "express-rate-limit"
import { initializeSocketIO } from "./socket/index.js";
import { ApiError } from "./utils/ApiError.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
	pingTimeout: 60000,
	cors: {
		origin: process.env.CORS_ORIGIN,
		credentials: true,
	},
});

app.set("io", io);

app.use(
	cors({
		origin:
			process.env.CORS_ORIGIN === "*"
				? "*"
				: process.env.CORS_ORIGIN?.split(","),
		credentials: true,
	})
);

app.use(requestIp.mw())

const limiter = rateLimit({
	windowMs: 15 * 60 *1000, // 15 Min
	limit: 100,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req, res) => {
		return req.clientIp;
	},
	handler: (req, res, next, options) => {
		throw new ApiError(
			options.statusCode || 500,
			`There are too many requests.You are allowed only ${options.limit} per ${options.windowMs / 60000} minutes.`
		)
	}
})

app.use(limiter)

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());


// import routes
import userRoutes from "./routes/auth/user.routes.js";
import chatRoutes from "./routes/app/chat.routes.js";
import messageRoutes from "./routes/app/message.routes.js";

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/message", messageRoutes);

initializeSocketIO(io);

app.use(errorHandler);

export { httpServer };
