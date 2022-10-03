import url from "./url";

const tripUrl = `${url.BASEURL}/api/diesels`;

// Create diesel
export const gasCar = async (data, token) => {
  try {
    const response = await fetch(tripUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("DIESEL CREATE API ERROR: ", error);
  }
};
