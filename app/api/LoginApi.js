// import { BASEURL } from "@env";

const baseUrl = `${process.env.BASEURL}/auth/login`;
console.log("URL: ", baseUrl);

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
