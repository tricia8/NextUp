import { getIdTokenFromFirebaseUser } from "../utils/getIdToken";

export async function generateSuggestion() {
  try {
    const token = await getIdTokenFromFirebaseUser();

    const res = await fetch(
      "https://nextup-l0e9.onrender.com/api/gemini/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      }
    );

    if (!res.ok) {
      const errMessage = await res.text();
      throw new Error(`Server error: ${res.status} ${errMessage}`);
    }

    const data = await res.json();

    return data;
  } catch (error) {
    console.log("Error generating suggestion:", error);
    throw error;
  }
}
