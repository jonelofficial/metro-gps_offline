import url from "./url";

const baseUrl = `${url.BASEURL}/api/users`;

export const getUsers = async (token) => {
  try {
    const response = await fetch(`${baseUrl}/?populate=*`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("GET USERS API ERROR: ", error);
  }
};

export const getImage = async (token) => {
  try {
    const response = await fetch(`${baseUrl}/me?populate=*`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("GET IMAGE API ERROR: ", error);
  }
};
