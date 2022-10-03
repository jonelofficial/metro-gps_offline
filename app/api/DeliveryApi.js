import url from "./url";

const tripUrl = `${url.BASEURL}/api/deliveries`;

export const createDelivery = async (data, token) => {
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
    console.log("CREATE-DELIVERY API ERROR: ", error);
  }
};

export const updateDelivery = async (id, data, token) => {
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
    console.log("UPDATE-DELIVERY API ERROR: ", error);
  }
};
