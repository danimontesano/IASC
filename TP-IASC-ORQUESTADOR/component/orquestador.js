import express from "express";
const app = express();
import io from "socket.io-client";
import * as HttpUtils from "../utils/utils.js";

app.use(express.json());

var DATOS_MASTER;
var DATOS_SLAVES;

export async function masterNode(port, hosts) {
  DATOS_MASTER = hosts.shift();
  console.log("datos master: " + DATOS_MASTER);
  DATOS_SLAVES = hosts;

  recepcionHeartbeat();

  app.listen(port, () => {
    console.log(`worker process ${process.pid} is listening on port 5100`);
  });

  app.get("*", async (req, res) => {
    console.log("original:");
    console.log(req.originalUrl);
    console.log(req.method);

    const response = await HttpUtils.get(DATOS_MASTER + req.originalUrl);
    const body = await response.json();
    res.status(response.status);
    res.json(body);
  });

  app.post("*", async (req, res) => {
    console.log("original:");
    console.log(req.originalUrl);
    console.log(req.method);

    const response = await HttpUtils.post(
      DATOS_MASTER + req.originalUrl,
      req.body
    );
    const body = await response.json();
    res.status(response.status);
    res.json(body);
  });

  app.put("*", async (req, res) => {
    console.log("original:");
    console.log(req.originalUrl);
    console.log(req.method);

    const response = await HttpUtils.put(
      DATOS_MASTER + req.originalUrl,
      req.body
    );
    const body = await response.json();
    res.status(response.status);
    res.json(body);
  });

  app.delete("*", async (req, res) => {
    console.log("original:");
    console.log(req.originalUrl);
    console.log(req.method);

    const response = await HttpUtils.delete(
      DATOS_MASTER + req.originalUrl,
      req.body
    );
    const body = await response.json();
    res.status(response.status);
    res.json(body);
  });
}

function recepcionHeartbeat() {
  const socket = io.connect(DATOS_MASTER, {
    query: {
      from: "ORQUESTADOR",
    },
  });

  socket.on("connect", () => {
    const engine = socket.io.engine;
    engine.on("packet", ({ type, data }) => {
      if (type == "ping") {
        console.log("Heartbeat");
      }
    });

    console.log(
      "ORQUESTADOR CONECTADO CON LA APLICACION MASTER. Socket ID: " + socket.id
    ); // x8WIv7-mJelg7on_ALbx
  });

  socket.on("disconnect", async () => {
    console.log("DATA MASTER Desconectado");
    // Decidir quien va a ser el nuevo master

    //Enviar mensaje para el nuevo master

    DATOS_MASTER = DATOS_SLAVES.shift();
    const url = DATOS_MASTER + "/convertirEnMaster";

    try {
      const res = await HttpUtils.post(url, DATOS_SLAVES);
      if (res.status == 200) {
        recepcionHeartbeat();
      }
    } catch (error) {
      console.log(error);
      console.log("No pude conectarme");
    }
  });
}
