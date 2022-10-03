import url from "./url";

const baseUrl = `${url.BASEURL}/api/upload/`;

export const uploadImage = async (form, token) => {
  try {
    const response = await fetch(baseUrl, {
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
    console.log("UPLOAD API ERROR: ", error);
  }
};
