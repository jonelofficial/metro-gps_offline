import url from "./url";

const tripUrl = `${url.BASEURL}/api/haulings`;

export const createHauling = async (data, token) => {
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
    console.log("CREATE-HAULING API ERROR: ", error);
  }
};

export const updateHauling = async (id, data, token) => {
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
    console.log("UPDATE-HAULING API ERROR: ", error);
  }
};

export const getMyHaulings = async (trip_id, token) => {
  try {
    const response = await fetch(
      `${tripUrl}?filters[trip_id][$eq]=${trip_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("GET-HAULING API ERROR: ", error);
  }
};
