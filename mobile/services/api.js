import { useAuth } from "@clerk/clerk-expo";

// URL cơ sở của API backend
const API_BASE_URL = "http://localhost:5001";

/**
 * Custom hook để tạo client API với token xác thực từ Clerk
 * @returns {Object} - Các hàm để gọi API với token xác thực
 */

export const useApiClient = () => {
    const { getToken } = useAuth();

    /**
     * Hàm helper để gọi API với token xác thực
     * @param {string} endpoint - Đường dẫn endpoint, bắt đầu bằng /
     * @param {Object} options - Các tùy chọn cho fetch API
     * @returns {Promise} - Promise với kết quả từ API
     */
    const apiCall = async (endpoint, options = {}) => {
        try {
            // Lấy token từ Clerk
            const token = await getToken();

            // Debug token
            console.log("Auth Token:", token ? "Token exists" : "No token");

            // Chuẩn bị headers với token
            const headers = {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options.headers || {}),
            };

            // Debug request
            console.log(`Calling API: ${API_BASE_URL}${endpoint}`, {
                method: options.method || "GET",
                hasHeaders: !!headers,
                hasBody: !!options.body,
            });

            // Gọi API với fetch
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            // Debug response
            console.log(`API Response Status: ${response.status}`);

            // Parse JSON response
            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.log("Non-JSON response:", text);
                data = { message: text };
            }

            // Debug data
            console.log("API Response Data:", data);

            // Kiểm tra nếu có lỗi từ API
            if (!response.ok) {
                throw new Error(
                    data.error?.message || `API error: ${response.status}`
                );
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    };

    // Trả về các phương thức để gọi API
    return {
        get: (endpoint) => apiCall(endpoint, { method: "GET" }),

        post: (endpoint, body) =>
            apiCall(endpoint, {
                method: "POST",
                body: JSON.stringify(body),
            }),

        put: (endpoint, body) =>
            apiCall(endpoint, {
                method: "PUT",
                body: JSON.stringify(body),
            }),

        patch: (endpoint, body) =>
            apiCall(endpoint, {
                method: "PATCH",
                body: JSON.stringify(body),
            }),

        delete: (endpoint) => apiCall(endpoint, { method: "DELETE" }),

        // Hàm kiểm tra token
        verifyToken: async () => {
            try {
                return await apiCall("/v1/auth/verify-token");
            } catch (error) {
                console.error("Token verification failed:", error);
                return { valid: false, error: error.message };
            }
        },

        // Hàm lấy thông tin người dùng
        getProfile: () => apiCall("/v1/auth/me"),

        // Hàm cập nhật hồ sơ
        updateProfile: (profileData) =>
            apiCall("/v1/auth/profile", {
                method: "PATCH",
                body: JSON.stringify(profileData),
            }),
    };
};
