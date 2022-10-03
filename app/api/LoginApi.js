import url from "./url";

const baseUrl = `${url.BASEURL}/auth/login`;

export const useLogin = async (user) => {
  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("LOGIN API ERROR: ", error);
  }
};
