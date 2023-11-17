const express = require("express");
const app = express(); //usar express.Router() para dividir en archivos
app.use(express.json());
const NodeCache = require("node-cache");
const myCache = new NodeCache();
const port = 5000;

const dani = {
  grupos: ["g0", "g1", "g2"],
};
const maxi = {
  grupos: ["g0", "g1", "g2"],
};
const grupo0 = {
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
const grupo2 = {
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
  myCache.set(key, conversacion);
  console.log(key);
  console.log(conversacion);
  res.status(200);
  res.json(message);
});

//GET
app.get("/chat", (req, res) => {
  const from = req.query.from;
  const to = req.query.to;

  const key = keyChatPrivado(from, to);
  let conversacion = myCache.get(key);

  if (!conversacion) {
    conversacion =
      to.charAt(0) == "g"
        ? {
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
        : { chat: [] };
    myCache.set(key, conversacion);
  }
  console.log(key);
  console.log(conversacion);
  res.status(200);
  res.json(conversacion.chat);
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
    conversacion.chat[idx].message = null;
    myCache.set(key, conversacion);

    res.sendStatus(200);
  } else {
    res.sendStatus(403);
  }
});

//MODIFY
app.put("/mensaje", (req, res) => {
  const from = req.body.from;
  const to = req.body.to;
  const idx = req.body.idx;

  const key = keyChatPrivado(from, to);
  let conversacion = myCache.get(key);
  const message = conversacion.chat[idx];

  if (message.from == from) {
    conversacion.chat[idx].message = req.body.message;
    myCache.set(key, conversacion);

    res.status(200);
    res.json(conversacion.chat[idx]);
  } else {
    res.sendStatus(403);
  }
});

/*
 *********** USUARIO ***********/

//GET USUARIO INFO
app.get("/usuario", (req, res) => {
  const from = req.query.from;

  const usuario = myCache.get(from);
  console.log(from);
  console.log(usuario);
  res.status(200);
  res.json(usuario);
});

//AGREGAR INTEGRANTE
app.post("/agregarIntegrante", (req, res) => {
  const from = req.body.from;
  const to = req.body.to;
  const nroIntegrante = req.body.integrante;

  const key = keyChatPrivado(from, to);
  const conversacion = myCache.get(key);
  const habilitado = false;

  if (to.charAt(0) == "g") {
    const usuarioSolicitante = conversacion.integrantes.find((i) =>
      i.numero == from ? true : false
    );

    const usuarioYaExistente = conversacion.integrantes.find((i) =>
      i.numero == nroIntegrante ? true : false
    );

    habilitado =
      usuarioSolicitante?.admin && !usuarioYaExistente ? true : false;
  }

  if (habilitado) {
    const integrante = {
      numero: nroIntegrante,
      admin: false,
      entradaGrupo: Date.now(),
      salidaGrupo: null,
    };

    conversacion.integrantes.push(integrante);
    myCache.set(key, conversacion);

    console.log(key);
    console.log(conversacion);
    res.status(200);
    res.json(integrante);
  } else {
    res.sendStatus(403);
  }
});

//ELIMINAR INTEGRANTE
app.delete("/eliminarIntegrante", (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  const nroIntegrante = req.query.integrante;

  const key = keyChatPrivado(from, to);
  const conversacion = myCache.get(key);
  const habilitado = false;

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
    myCache.set(key, conversacion);

    console.log(key);
    console.log(conversacion);
    res.status(200);
    res.json(integrante);
  } else {
    res.sendStatus(403);
  }
});

//HACER ADMINISTRADOR
app.put("/convertirAdmin", (req, res) => {
  const from = req.body.from;
  const to = req.body.to;
  const nroIntegrante = req.body.integrante;

  const key = keyChatPrivado(from, to);
  const conversacion = myCache.get(key);
  const habilitado = false;

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
    myCache.set(key, conversacion);

    console.log(key);
    console.log(conversacion);
    res.sendStatus(200);
  } else {
    res.sendStatus(403);
  }
});

app.listen(port, () => {
  console.log(`process ${process.pid} is listening on port ${port}`);
});

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
