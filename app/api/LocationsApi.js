import url from "./url";

const tripUrl = `${url.BASEURL}/api/locations`;

export const createLocation = async (data, token) => {
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
    console.log("CREATE LOCATIONS API ERROR: ", error);
  }
};

export const updateLocation = async (id, data, token) => {
  try {
    const response = await fetch(`${tripUrl}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("UPDATE LOCATIONS API ERROR: ", error);
  }
};
