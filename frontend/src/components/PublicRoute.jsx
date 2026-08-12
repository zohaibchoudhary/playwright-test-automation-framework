import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function PublicRoute({ children }) {
	const { user, token } = useAuth();

	if (token && user._id) return <Navigate to="/chat" replace />;

	return children;
}

export default PublicRoute;
