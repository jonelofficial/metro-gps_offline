const tripUrl = `${process.env.BASEURL}/office/diesel`;

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

export const gasCarBulk = async (obj, id, token) => {
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
    console.log("DIESEL BULK ERROR: ", error);
  }
};
