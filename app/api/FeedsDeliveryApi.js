import url from "./url";

const tripUrl = `${url.BASEURL}/api/feeds-deliveries`;

export const createFeedsDelivery = async (data, token) => {
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
    console.log("CREATE-FEEDS-DELIVERY API ERROR: ", error);
  }
};
