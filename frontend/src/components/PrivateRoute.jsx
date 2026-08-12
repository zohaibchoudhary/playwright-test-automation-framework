import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function PrivateRoute({ children }) {
	const { user, token } = useAuth();

	if (!token && !user?._id) return <Navigate to="/" replace />;

	return children;
}

export default PrivateRoute;
