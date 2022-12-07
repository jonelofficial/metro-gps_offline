const tripUrl = `${process.env.BASEURL}/office/trips`;

export const createTrip = async (form, token) => {
  try {
    const response = await fetch(`${process.env.BASEURL}/office/trip`, {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("CREATE-TRIP API ERROR: ", error);
  }
};

export const getTrip = async (token, page) => {
  try {
    const response = await fetch(`${tripUrl}/user?page=${page}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("GET-TRIP API ERROR: ", error);
  }
};

/*
 * FOR SEARCH FUNCTION
 */
export const findTrip = async (token, trip_date, page) => {
  try {
    const response = await fetch(
      `${tripUrl}/search?searchDate=${trip_date}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("FIND-TRIP API ERROR: ", error);
  }
};

export const updateTrip = async (id, data, token) => {
  try {
    const response = await fetch(`${process.env.BASEURL}/office/trip/${id}`, {
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
    console.log("UPDATE-TRIP API ERROR: ", error);
  }
};

export const getVehicleTrip = async (id, token) => {
  try {
    const response = await fetch(
      `${process.env.BASEURL}/office/trips/vehicle?vehicleId=${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("GET VEHICLE TRIP ERROR: ", error);
  }
};

export const deleteTrip = async (id, token) => {
  try {
    const response = await fetch(`${process.env.BASEURL}/office/trip/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("DELETE ALL TRIP ERROR: ", error);
  }
};
