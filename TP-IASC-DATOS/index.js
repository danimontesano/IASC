import NodeCache from "node-cache";
const myCache = new NodeCache();

import express, { response } from "express";
const app = express(); //usar express.Router() para dividir en archivos

//var http = require("http").Server(app);
import { Server as httpServer } from "http";
const http = httpServer(app);

//var io = require("socket.io")(http);
/*import { Server as socketServer } from "socket.io";
const ioServer = new socketServer(http);*/

import ioClient from "socket.io-client";
import * as HttpUtils from "./utils/utils.js";

app.use(express.json());

//const ip = process.argv[2];
//const port = process.argv[3];
//var IP_ORQUESTADOR = process.argv[4];
//var PUERTO_ORQUESTADOR = process.argv[5];

const ip = process.env.IP;
const port = process.env.PUERTO;
var IP_ORQUESTADOR = process.env.IP_ORQUESTADOR;
var PUERTO_ORQUESTADOR = process.env.PUERTO_ORQUESTADOR;

const MY_URL = "http://" + ip + ":" + port;
var DATOS_SLAVES = [];

// Para cuando esté en docker
//const port = process.env.PORT || 3000;
//var STATUS = process.env.STATUS_INICIAL || 'SLAVE';

const dani = {
  grupos: ["g0", "g1", "g2"],
};
const maxi = {
  grupos: ["g0", "g1", "g2"],
};
const grupo0 = {
  ultimaModificacion: Date.now(),
  integrantes: [
    {
      numero: "54 9 11 3679-2353",
      admin: true,
      entradaGrupo: 1699392877416,
      salidaGrupo: null,
    },
    {
      numero: "54 9 11 6947-5274",
      admin: false,
      entradaGrupo: 1699392877416,
      salidaGrupo: null,
    },
  ],
  chat: [],
};
const grupo1 = {
  ultimaModificacion: Date.now(),
  integrantes: [
    {
      numero: "54 9 11 3679-2353",
      admin: true,
      entradaGrupo: 1699392877416,
      salidaGrupo: null,
    },
    {
      numero: "54 9 11 6947-5274",
      admin: false,
      entradaGrupo: 1699392877416,
      salidaGrupo: null,
    },
    {
      numero: "54 9 11 6947-5273",
      admin: false,
      entradaGrupo: 1699392877416,
      salidaGrupo: null,
    },
  ],
  chat: [],
};
const grupo2 = {
  ultimaModificacion: Date.now(),
  integrantes: [
    {
      numero: "54 9 11 3679-2353",
      admin: true,
      entradaGrupo: 1699392877416,
      salidaGrupo: null,
    },
    {
      numero: "54 9 11 6947-5274",
      admin: false,
      entradaGrupo: 1699392877416,
      salidaGrupo: null,
    },
  ],
  chat: [],
};

myCache.set("54 9 11 3679-2353", dani);
myCache.set("54 9 11 6947-5274", maxi);
myCache.set("g0", grupo0);
myCache.set("g1", grupo1);
myCache.set("g2", grupo2);

process.on("SIGINT", () => {
  console.log("Cerrando memoria");
  myCache.close();
  process.exit();
});

/*
 *********** PRIVADO ***********/

//POST
app.post("/mensaje", (req, res) => {
  const from = req.body.from;
  const to = req.body.to;

  const key = keyChatPrivado(from, to);
  const conversacion = myCache.get(key);

  const message = {
    idx: conversacion.chat.length,
    timeStamp: Date.now(),
    from: from,
    message: req.body.message,
  };

  conversacion.chat.push(message);

  conversacion.ultimaModificacion = Date.now();
  myCache.set(key, conversacion);
  console.log("Se guarda información en la key: " + key);
  console.log(conversacion);

  // Replicacion Aqui
  replicarResultadoOperacion(key, conversacion);

  message.enviarNotificacion = true;
  res.status(200);
  res.json(message);
});

//POST NUEVO CHAT
app.post("/chatNuevo", (req, res) => {
  const from = req.body.from;
  const to = req.body.to;

  const key = keyChatPrivado(from, to);
  let conversacion = myCache.get(key);

  if (!conversacion) {
    conversacion =
      to.charAt(0) == "g"
        ? {
            ultimaModificacion: Date.now(),
            integrantes: [
              {
                numero: from,
                admin: true,
                entradaGrupo: Date.now(),
                salidaGrupo: null,
              },
            ],
            chat: [],
          }
        : { ultimaModificacion: Date.now(), chat: [] };
    myCache.set(key, conversacion);
  }
  console.log("Se guarda información en la key: " + key);
  console.log(conversacion);

  // FILTRADO LOGICO DE CHATS ELIMINADOS
  const tiempoActual = Date.now(); // Obtener el tiempo actual en milisegundos
  conversacion.chat = conversacion.chat.filter(
    (message) => message.expiry > tiempoActual
  );

  // Replicacion Aqui
  replicarResultadoOperacion(key, conversacion);

  res.status(200);
  res.json(conversacion.chat);
});

//GET
app.get("/chat", (req, res) => {
  const from = req.query.from;
  const to = req.query.to;

  const key = keyChatPrivado(from, to);
  let conversacion = myCache.get(key);

  if (!conversacion) {
    res.status(404);
    res.json(null);
  } else if (
    esGrupo(to) &&
    !conversacion.integrantes.find((x) => x.numero == from)
  ) {
    res.status(401);
    res.json(null);
  } else {
    // FILTRADO LOGICO DE CHATS ELIMINADOS
    const tiempoActual = Date.now(); // Obtener el tiempo actual en milisegundos
    conversacion.chat = conversacion.chat.filter(
      (message) => !(message.expiry < tiempoActual)
    );

    console.log("Se lee información de la key: " + key);
    console.log(conversacion);

    res.status(200);
    res.json(conversacion.chat);
  }
});

//DELETE
app.delete("/mensaje", (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  const idx = req.query.idx;

  let habilitado = false;

  const key = keyChatPrivado(from, to);
  let conversacion = myCache.get(key);
  const message = conversacion.chat[idx];

  if (message.from == from) {
    habilitado = true;
  } else {
    if (to.charAt(0) == "g") {
      const integrante = conversacion.integrantes.find((i) =>
        i.numero == from ? true : false
      );

      habilitado = integrante?.admin ? true : false;
    }
  }

  if (habilitado) {
    const time = Date.now();
    conversacion.chat[idx].expiry = time;
    conversacion.ultimaModificacion = time;
    console.log("Se elimina información de la key: " + key);
    console.log(conversacion);
    myCache.set(key, conversacion);

    // Replicacion Aqui
    replicarResultadoOperacion(key, conversacion);

    res.status(200);
    res.json(null);
  } else {
    res.status(403);
    res.json(null);
  }
});

//MODIFY
app.put("/mensaje", (req, res) => {
  const from = req.body.from;
  const to = req.body.to;
  const idx = req.body.idx;

  const key = keyChatPrivado(from, to);
  const conversacion = myCache.get(key);
  var message = conversacion.chat[idx];

  if (message.from == from) {
    conversacion.chat[idx].message = req.body.message;
    conversacion.ultimaModificacion = Date.now();
    myCache.set(key, conversacion);

    // Replicacion Aqui
    replicarResultadoOperacion(key, conversacion);

    res.status(200);
    res.json(conversacion.chat[idx]);
  } else {
    res.status(403);
    res.json(null);
  }
});

//POST MENSAJE SEGURO
app.post("/mensaje/secure", (req, res) => {
  const from = req.body.from;
  const to = req.body.to;
  const timeToLive = req.body.timeToLive;
  const key = keyChatPrivado(from, to);
  const conversacion = myCache.get(key);

  /* TODO: PENSAR LOGICA PARA EL TIEMPO DE VIDA DE LOS MENSAJES SEGUROS
   * Opciones:
   *   - crear eventos que se encargue de eliminarlos
   *   - simplemente no enviarlos si el tiempo es mayor al tiempo actual
   */
  const tiempoCreacion = Date.now();

  const message = {
    idx: conversacion.chat.length,
    timeStamp: tiempoCreacion,
    expiry: tiempoCreacion + timeToLive * 1000,
    from: from,
    message: req.body.message,
  };

  conversacion.chat.push(message);
  conversacion.ultimaModificacion = tiempoCreacion;
  myCache.set(key, conversacion);
  console.log("Se guarda información en la key: " + key);
  console.log(conversacion);

  // Replicacion Aqui
  replicarResultadoOperacion(key, conversacion);

  message.enviarNotificacion = true;
  res.status(200);
  res.json(message);
});

/*
 *********** USUARIO ***********/

//GET USUARIO INFO
app.get("/usuario", (req, res) => {
  const from = req.query.from;

  const usuario = myCache.get(from);
  res.status(200);
  res.json(usuario);
});

//GET USUARIOS DE LOS GRUPOS
app.get("/integrantesDelGrupo", (req, res) => {
  const grupo = req.query.grupo;

  const dataDelGrupo = myCache.get(grupo);
  const integrantesDelGrupo = dataDelGrupo.integrantes;

  res.status(200);
  res.json(integrantesDelGrupo);
});

//AGREGAR INTEGRANTE
app.post("/agregarIntegrante", (req, res) => {
  const from = req.body.from;
  const to = req.body.to;
  const nroIntegrante = req.body.nroIntegrante;

  const key = keyChatPrivado(from, to);
  const conversacion = myCache.get(key);
  let habilitado = false;

  if (to.charAt(0) == "g") {
    const usuarioSolicitante = conversacion.integrantes.find((i) =>
      i.numero == from ? true : false
    );

    const usuarioYaExistente = conversacion.integrantes.find((i) =>
      i.numero == nroIntegrante ? true : false
    );

    if (!usuarioSolicitante?.admin) {
      console.log(
        `Usuario ${nroIntegrante} no agregado al grupo ${to}. Motivo: El usuario ${from} no es admin`
      );
    } else if (usuarioYaExistente) {
      console.log(
        `Usuario ${nroIntegrante} no agregado. Motivo: Usuario ${nroIntegrante} ya pertenece al grupo ${to}`
      );
    }

    habilitado =
      usuarioSolicitante?.admin && !usuarioYaExistente ? true : false;
  }

  if (habilitado) {
    const time = Date.now();

    const integrante = {
      numero: nroIntegrante,
      admin: false,
      entradaGrupo: time,
      salidaGrupo: null,
    };

    conversacion.integrantes.push(integrante);
    conversacion.ultimaModificacion = time;
    myCache.set(key, conversacion);

    console.log("Se guarda información en la key: " + key);
    console.log(conversacion);

    // Replicacion Aqui
    replicarResultadoOperacion(key, conversacion);

    res.status(200);
    res.json(integrante);
  } else {
    res.status(403);
    res.json(null);
  }
});

//ELIMINAR INTEGRANTE
app.delete("/eliminarIntegrante", (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  const nroIntegrante = req.query.integrante;

  const key = keyChatPrivado(from, to);
  const conversacion = myCache.get(key);
  let habilitado = false;

  let usuarioEnGrupoIdx = -1;

  if (to.charAt(0) == "g") {
    const usuarioSolicitante = conversacion.integrantes.find((i) =>
      i.numero == from ? true : false
    );

    usuarioEnGrupoIdx = conversacion.integrantes.findIndex((i) =>
      i.numero == nroIntegrante ? true : false
    );

    habilitado =
      usuarioSolicitante?.admin && usuarioEnGrupoIdx >= 0 ? true : false;
  }

  if (habilitado) {
    const integrante = conversacion.integrantes.splice(usuarioEnGrupoIdx, 1);
    conversacion.ultimaModificacion = Date.now();
    myCache.set(key, conversacion);

    console.log("Se guarda información en la key: " + key);
    console.log(conversacion);

    // Replicacion Aqui
    replicarResultadoOperacion(key, conversacion);

    res.status(200);
    res.json(integrante);
  } else {
    res.status(403);
    res.json(null);
  }
});

//HACER ADMINISTRADOR
app.put("/convertirAdmin", (req, res) => {
  const from = req.body.from;
  const to = req.body.to;
  const nroIntegrante = req.body.nroIntegrante;

  const key = keyChatPrivado(from, to);
  const conversacion = myCache.get(key);
  let habilitado = false;

  let usuarioEnGrupoIdx = -1;

  if (to.charAt(0) == "g") {
    const usuarioSolicitante = conversacion.integrantes.find((i) =>
      i.numero == from ? true : false
    );

    usuarioEnGrupoIdx = conversacion.integrantes.findIndex((i) =>
      i.numero == nroIntegrante ? true : false
    );

    habilitado =
      usuarioSolicitante?.admin && usuarioEnGrupoIdx >= 0 ? true : false;
  }

  if (habilitado) {
    conversacion.integrantes[usuarioEnGrupoIdx].admin = true;
    conversacion.ultimaModificacion = Date.now();
    myCache.set(key, conversacion);

    console.log("Nuevo estado de los integrantes del grupo:");
    console.log(conversacion.integrantes);

    // Replicacion Aqui
    replicarResultadoOperacion(key, conversacion);

    res.status(200);
    res.json(conversacion.integrantes);
  } else {
    res.status(403);
    res.json(null);
  }
});

/*
 *********** REPLICACION DE DATOS ***********/

app.post("/cargarMemoriaEntera", (req, res) => {
  console.log("Cargando replica de la informacion del master");
  const body = req.body;
  myCache.flushAll();
  myCache.mset(body);
  console.log("------------------Memoria cargada--------------------");
  console.log(myCache.mget(myCache.keys()));
  console.log("-----------------------------------------------------");

  res.status(200);
  res.json(null);
});

app.post("/replicacionOperacion", (req, res) => {
  const key = req.body.key;
  const value = req.body.value;
  const oldData = myCache.get(key);

  if (
    oldData == undefined ||
    value?.ultimaModificacion > oldData?.ultimaModificacion
  ) {
    myCache.set(key, value);

    console.log("Se replicó la operación realizada en el master: ");
    console.log(value);
  } else if (
    oldData?.ultimaModificacion == undefined ||
    value?.ultimaModificacion == undefined
  ) {
    console.log("Al replicar uno de los datos no posee ultimaModificacion");
  } else {
    console.log("Dato replicado desactualizado");
  }
  res.status(200);
  res.json(null);
});

http.listen(port, () => {
  //console.log(`process ${process.pid} is listening on port ${port}`);
});
/*
 *****************************
 *  FUNCIONES DE NODE-CACHE  *
 *****************************
 */
function keyChatPrivado(from, to) {
  if (to.charAt(0) == "g") {
    return to;
  }

  if (from >= to) {
    return from + ":" + to;
  } else {
    return to + ":" + from;
  }
}

function replicarTodaLaMemoriaEn(url, socket) {
  const data = myCache.mget(myCache.keys());

  console.log("Se envió para replicar la memoria entera al slave: " + url);
  console.log(data);

  HttpUtils.post(url + "/cargarMemoriaEntera", transformObjectToList(data))
    .then(() => {
      DATOS_SLAVES.push(url);
      console.log(
        "La memoria entera fue replicada correctamente en el slave: " + url
      );
    })
    .catch(() => {
      socket.emit("REPLICACION-FALLIDA", url);
      console.log("Error al replicar la memoria entera en el slave: " + url);
    });
}

function transformObjectToList(obj) {
  return Object.entries(obj).map(([key, val]) => ({ key, val }));
}

function replicarResultadoOperacion(key, value) {
  DATOS_SLAVES.forEach((urlSlave) => {
    const message = {
      key: key,
      value: value,
    };
    console.log(
      "Se envia a replicar la operacion upsert al slave: " + urlSlave
    );
    HttpUtils.post(urlSlave + "/replicacionOperacion", message);
  });
}

/*
 ****************************
 *  SOCKET.IO - HEARTBEATS  *
 ****************************
 */

recepcionHeartbeat("http://" + IP_ORQUESTADOR + ":" + PUERTO_ORQUESTADOR);

function recepcionHeartbeat(urlOrquestador) {
  const socket = ioClient.connect(urlOrquestador, {
    query: {
      type: "HII-DATOS",
      url: MY_URL,
    },
  });

  socket.on("connect", () => {
    const engine = socket.io.engine;
    engine.on("packet", ({ type, data }) => {
      if (type == "ping") {
        //console.log("Heartbeat");
      }
    });

    console.log("CONECTADO CON EL ORQUESTADOR. Socket ID: " + socket.id); // x8WIv7-mJelg7on_ALbx
  });

  socket.on("ASIGNADO-MASTER", (data) => {
    console.log("ASIGNADO: MASTER");
    console.log("Listado de slaves: ");
    console.log(data);
    DATOS_SLAVES = data;
    //enviarHeartbeats();
  });

  socket.on("ASIGNADO-SLAVE", (data) => {
    console.log("ASIGNADO: SLAVE");
  });

  socket.on("NUEVO-SLAVE", (url) => {
    console.log("Se agregó el SLAVE: " + url + " Slaves actuales: ");
    console.log(DATOS_SLAVES);
    replicarTodaLaMemoriaEn(url, socket);
  });

  socket.on("SLAVE-CAIDO", (data) => {
    DATOS_SLAVES = DATOS_SLAVES.filter((slave) => slave !== data);

    console.log("Se cayó el SLAVE: " + data + " Slaves actuales: ");
    console.log(DATOS_SLAVES);
  });

  socket.on("disconnect", async () => {
    console.log("ORQUESTADOR Desconectado");
    // Decidir quien va a ser el nuevo master
  });
}

function esGrupo(to) {
  if (to) {
    return to.charAt(0) == "g";
  } else {
    return false;
  }
}

/*
 *
 * Por ahora no queremos que el datos master envie heartbeats a los slaves. 
 * Todo este funcionamiento está concentrado en el orquestador
 *
 *
function enviarHeartbeats() {
  ioServer.on("connection", (socket) => {
    console.log("Conexion recibida. From: " + socket.handshake.query["from"]);
    

    socket.on("disconnect", function (reason) {
      
      console.log("Orquestador down");
      console.log(reason);
    });

    socket.conn.on("packet", function (packet) {
      if (packet?.type == "pong") {
        console.log("Envio Heartbeat");
      }
    });
  });
}
*/
