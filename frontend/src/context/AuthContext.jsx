import { createContext, useContext, useState, useEffect } from "react";
import { registerUser, loginUser, logoutUser } from "@/api";
import { LocalStorage, requestHandler } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Loader } from "@/components";

export const AuthContext = createContext({
	user: null,
	token: null,
	register: async () => {},
	login: async () => {},
	logout: async () => {},
});

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(null);

	const navigate = useNavigate();

	const register = async (data) => {
		await requestHandler(
			async () => await registerUser(data),
			setIsLoading,
			() => {
				alert("Account created successfully! Go ahead and login.");
				navigate("/");
			},
			alert
		);
	};

	const login = async (data) => {
		await requestHandler(
			async () => await loginUser(data),
			setIsLoading,
			(res) => {
				const {data} = res;
				setUser(data.user);
				setToken(data.accessToken);
        LocalStorage.set("user", data.user);
        LocalStorage.set("token", data.accessToken);
        navigate("/chat")
			},
			alert
		);
	};

  const logout = async() => {
    await requestHandler(
      async() => await logoutUser(),
      setIsLoading,
      () => {
        setUser(null)
        setToken(null)
        LocalStorage.clear()
        navigate("/login")
      },
      alert
    )
  }

  useEffect(() => {
    setIsLoading(true);
    const _token = LocalStorage.get("token");
    const _user = LocalStorage.get("user");
    if (_token && _user?._id) {
      setUser(_user);
      setToken(_token);
			// navigate('/chat')
    }
    setIsLoading(false);
  }, []);
	return (
		<AuthContext.Provider value={{ user, token, register, login, logout }}>
			{ isLoading ? <Loader /> : children }
		</AuthContext.Provider>
	);
};

export { useAuth, AuthProvider };
