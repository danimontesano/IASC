import express from "express";
const app = express();
import * as HttpUtils from "../utils/utils.js";

import { Server as httpServer } from "http";
const http = httpServer(app);

import { Server as socketServer } from "socket.io";
const ioServer = new socketServer(http);

app.use(express.json());

const REGISTRY = {};
var DATOS_MASTER = undefined;
var DATOS_SLAVES = [];

export async function masterNode(port) {
  enviarHeartbeats();

  http.listen(port, () => {
    console.log(`worker process ${process.pid} is listening on port 5100`);
  });

  app.post("/registrarCliente", (req, res) => {
    console.log(req.body.url);
    console.log(req.body.nroTelefono);

    REGISTRY[req.body.nroTelefono] = req.body.url;

    updateRegistry(req.body.nroTelefono, req.body.url);

    res.status(200);
    res.json(null);
    console.log(REGISTRY);
  });

  app.get("*", async (req, res) => {
    console.log("original:");
    console.log(req.originalUrl);
    console.log(req.method);

    const response = await HttpUtils.get(DATOS_MASTER.url + req.originalUrl);
    const body = await response.json();

    res.status(response.status);
    res.json(body);
  });

  app.post("*", async (req, res) => {
    console.log("original:");
    console.log(req.originalUrl);
    console.log(req.method);

    const response = await HttpUtils.post(
      DATOS_MASTER.url + req.originalUrl,
      req.body
    );
    const body = await response.json();

    res.status(response.status);
    res.json(body);

    console.log(body);
    //Enviar notificaciones
    if (body?.enviarNotificacion) {
      const to = req?.body?.to;
      const from = req?.body?.from;
      if (esGrupo(to)) {
        //TODO para ir a buscar los integrantes del grupo, hacer de forma asincronica
        const response = await HttpUtils.get(DATOS_MASTER.url +  `/integrantesDelGrupo?grupo=${to}`);
        const integrantesDelGrupo = await response.json();
        
        console.log("Los integrantes del grupo " + to);
        console.log(integrantesDelGrupo);

        for( const integrante of  integrantesDelGrupo){
          if (REGISTRY[integrante.numero] && from != integrante.numero) HttpUtils.post(REGISTRY[integrante.numero], body);
        }

      } else if (to) {
        console.log(body);
        if (REGISTRY[to]) HttpUtils.post(REGISTRY[to], body);
      } else {
      }
    }
  });

  app.put("*", async (req, res) => {
    console.log("original:");
    console.log(req.originalUrl);
    console.log(req.method);

    const response = await HttpUtils.put(
      DATOS_MASTER.url + req.originalUrl,
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

    const response = await HttpUtils.del(
      DATOS_MASTER.url + req.originalUrl,
      req.body
    );

    const body = await response.json();
    res.status(response.status);
    res.json(body);
  });
}

function enviarHeartbeats() {
  ioServer.on("connection", (socket) => {
    const type = socket.handshake.query["type"];
    const url = socket.handshake.query["url"];
    console.log("Conexion recibida. Type: " + type);
    if (type == "HII-DATOS") {
      if (DATOS_MASTER == undefined) {
        const data = [];
        socket.emit("ASIGNADO-MASTER", data);
        DATOS_MASTER = { url: url, socket: socket };
        console.log("Se asignó el nuevo MASTER: " + url);
      } else {
        const data = {
          master: DATOS_MASTER.url,
        };
        socket.emit("ASIGNADO-SLAVE", data);
        DATOS_SLAVES.push({ url: url, socket: socket });
        DATOS_MASTER.socket.emit("NUEVO-SLAVE", url);
        console.log("Se agregó el SLAVE: " + url + " Slaves actuales: ");
        console.log(DATOS_SLAVES.map((slave) => slave.url));
      }
    }
    /*
      Codigo para cuando se conecta un cliente
      */

    socket.on("disconnect", function (reason) {
      /*
        Codigo para cuando se desconecta un cliente
        */

      if (DATOS_MASTER.socket.id == socket.id) {
        console.log("Se cayó el MASTER: " + url);
        DATOS_MASTER = DATOS_SLAVES.shift();
        if (DATOS_MASTER != undefined) {
          const data = DATOS_SLAVES.map((slave) => slave.url);
          DATOS_MASTER.socket.emit("ASIGNADO-MASTER", data);
          console.log("Se asignó el nuevo MASTER: " + DATOS_MASTER.url);
        }
      } else if (
        DATOS_SLAVES.map((slave) => slave.socket.id).includes(socket.id)
      ) {
        console.log("Se cayó el SLAVE: " + url);
        DATOS_SLAVES = DATOS_SLAVES.filter(
          (slave) => slave.socket.id !== socket.id
        );
        DATOS_MASTER.socket.emit("SLAVE-CAIDO", url);
      }
    });

    socket.conn.on("packet", function (packet) {
      if (packet?.type == "pong") {
        console.log("Envio Heartbeat");
      }
    });
  });
}

/**
 * REGISTRY
 */
//Para que sea asincronico se tiene que pasar a una promise
function updateRegistry(nroTelefono, url) {
  for (const key in REGISTRY) {
    if (REGISTRY.hasOwnProperty(key)) {
      if (REGISTRY[key] == url) {
        if (key != nroTelefono) {
          delete REGISTRY[key];
        }
      }
    }
  }
}

function esGrupo(to) {
  if (to) {
    return to.charAt(0) == "g";
  } else {
    return false;
  }
}

/*
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
*/
