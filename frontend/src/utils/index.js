export const isBrowser = typeof window !== "undefined";

export const classNames = (...className) => {
  // Filter out any empty class names and join them with a space
	return className.filter(Boolean).join(" ");
};

export const requestHandler = async (api, setLoading, onSuccess, onError) => {
	setLoading && setLoading(true);
	try {
		const response = await api();
		const { data } = response;
    console.log(data);
    
		if (data?.success) {
			onSuccess(data);
		}
	} catch (error) {
		if (isBrowser) {
			window.location.href = "/";
		}
		onError(error?.response?.data?.message || "Something went wrong");
	} finally {
		setLoading && setLoading(false);
	}
};

export class LocalStorage {
  static get(key) {
    if (!isBrowser) return;
    const value = localStorage.getItem(key);

    if (value) return JSON.parse(value)
    return null;
  }

  static set(key, value) {
    if (!isBrowser) return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  static remove(key) {
    if (!isBrowser) return;
    localStorage.removeItem(key);
  }

  static clear() {
    if (!isBrowser) return;
    localStorage.clear();
  }
}
