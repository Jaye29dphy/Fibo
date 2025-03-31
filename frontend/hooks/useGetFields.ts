import { API_ENDPOINTS } from "../constants/apiConfig";

export const getFields = async (sportType: string) => {
  try {
    const url = `${API_ENDPOINTS.GET_FIELDS}?sport_type=${encodeURIComponent(sportType)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching fields:", error);
    throw error;
  }
};
