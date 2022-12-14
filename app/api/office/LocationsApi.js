const tripUrl = `${process.env.BASEURL}/office/location`;

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

export const createBulkLocation = async (obj, id, token) => {
  try {
    const res = await fetch(`${tripUrl}/bulk?id=${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(obj),
    });
    const json = await res.json();
    return json;
  } catch (error) {
    console.log("CRETE BULK TRIP ERROR: ", error);
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
