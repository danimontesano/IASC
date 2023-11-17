import fetch from "node-fetch";

export async function get(url) {
  const params = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch(url, params);
  return response;
}

export async function post(url, body) {
  const params = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };

  const response = await fetch(url, params);
  return response;
}

export async function put(url, body) {
  const params = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };

  const response = await fetch(url, params);
  return response;
}

export async function del(url) {
  const params = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch(url, params);
  return response;
}
