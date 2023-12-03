import { menu } from "./menu.js";
import cluster from "cluster";
import * as HttpUtils from "../utils/utils.js";

const SERVER = "http://localhost:5100";
const espaciado = "\t\t\t\t\t\t\t";
const lastMessage = {};
var numeroTelefono;

export async function chat(chatID, numero) {
  numeroTelefono = numero;
  process.stdout.write("\x1bc");
  await cargarChatsViejos(chatID);

  const envioDeMensajes = cluster.fork({
    TYPE: "envioDeMensajes",
    CONTACT: chatID,
  });
  const receptorDeMensajes = cluster.fork({
    TYPE: "receptorDeMensajes",
  });
  envioDeMensajes.on("message", (jsonData) =>
    lecturaConsola(jsonData, envioDeMensajes, receptorDeMensajes)
  );
  receptorDeMensajes.on("message", (jsonData) =>
    imprimirMensajeAjeno(jsonData)
  );

  /*
  process.on("SIGINT", function () {
    console.log("SIGINT");
    envioDeMensajes.kill();
    receptorDeMensajes.kill();
  });*/

  envioDeMensajes.on("exit", (code, signal) => {
    console.log("exit");
    receptorDeMensajes.kill();
    envioDeMensajes.kill();
    process.exit();
  });
}

// Si el mensaje que se envía por la consola del chat inicia con alguno de estos comandos iniciales se procesará según el tipo de comando
async function lecturaConsola(data, envioDeMensajes, receptorDeMensajes) {
  let message = data.message.match(/^\/\S+\s*/g);

  message = message ? message[0].trim() : data.message;

  switch (message.toLowerCase()) {
    case "/exit":
      //envioDeMensajes.kill();
      receptorDeMensajes.kill();
      menu(numeroTelefono);
      break;

    case "/add":
      if (esGrupo(data.to)) {
        const userNumber = data.message.slice("/add".length).trim();
        const response = await agregarUsuarioAlGrupo(userNumber, data.to);
        const mensaje = response
          ? `${espaciado}Usuario ${userNumber} agregado correctamente`
          : `${espaciado}---Usuario, grupo o permisos inválidos---`;
        console.log(mensaje);
      } else {
        console.log(`${espaciado}---COMANDO SOLO VÁLIDO PARA GRUPOS---`);
      }
      break;

    case "/expel":
      if (esGrupo(data.to)) {
        const userNumber = data.message.slice("/expel".length).trim();
        const response = await eliminarUsuarioDeGrupo(userNumber, data.to);
        const mensaje = response
          ? `${espaciado}Usuario ${userNumber} eliminado correctamente`
          : `${espaciado}---Usuario, grupo o permisos inválidos---`;
        console.log(mensaje);
      } else {
        console.log(`${espaciado}---COMANDO SOLO VÁLIDO PARA GRUPOS---`);
      }

      break;

    case "/admin":
      if (esGrupo(data.to)) {
        const userNumber = data.message.slice("/admin".length).trim();
        const response = await ascenderAdmin(userNumber, data.to);
        const mensaje = response
          ? `${espaciado}Usuario ${userNumber} ascendido a admin correctamente`
          : `${espaciado}---Usuario, grupo o permisos inválidos---`;
        console.log(mensaje);
      } else {
        console.log(`${espaciado}---COMANDO SOLO VÁLIDO PARA GRUPOS---`);
      }

      break;

    case "/delete":
      var messageID = data.message.slice("/delete".length).trim();
      if (messageID && !isNaN(messageID)) {
        const response = await eliminarMensaje(messageID, data.to);
        const mensaje = response
          ? `${espaciado}Mensaje ${messageID} eliminado correctamente`
          : `${espaciado}---Usuario, grupo o permisos inválidos---`;
        console.log(mensaje);
      } else {
        console.log(
          `${espaciado}---COMANDO INVÁLIDO, AGREGAR ID DE MENSAJE---`
        );
      }
      console.log(mensaje);
      break;

    case "/edit":
      var params = data.message
        .slice("/edit".length)
        .trim()
        .match(/^\d+ |.+/g);

      var mensaje;
      if (params.length == 2) {
        var messageID = params[0];
        var nuevoChat = params[1];

        const response = await editarMensaje(nuevoChat, messageID, data.to);
        mensaje = response
          ? `${espaciado}Mensaje ${messageID} eliminado correctamente`
          : `${espaciado}---Usuario, grupo o permisos inválidos---`;
      } else {
        mensaje = `${espaciado}---COMANDO INVÁLIDO, AGREGAR ID DE MENSAJE---`;
      }
      console.log(mensaje);
      break;

    case "/secure":
      const parametros = data.message.slice("/secure".length).trim();

      let timeToLive = parametros.match(/^\d+\s/g);

      if (timeToLive && timeToLive.length > 0) {
        timeToLive = timeToLive[0];
        const mensaje = parametros.slice(timeToLive);
        timeToLive = timeToLive.trim();

        const response = await enviarMensajeSeguro(mensaje, timeToLive);
        if (response) {
          imprimirMensajePropio(response);
        } else {
          console.log(`${espaciado}---EL MENSAJE NO PUDO SER ENVIADO---`);
        }
      } else {
        console.log(`${espaciado}---PARAMETROS INVALIDOS---`);
      }
      break;

    default:
      const response = await enviarMensaje(data);
      if (response) {
        imprimirMensajePropio(response);
      } else {
        console.log(`${espaciado}---EL MENSAJE NO PUDO SER ENVIADO---`);
      }
  }
}

function imprimirMensajePropio(data) {
  const message = data.message;
  const from = numeroTelefono;

  const messagesLines = (message.match(/.{1,54}$|.{1,54} +/g) || []).map((s) =>
    s.trim()
  );

  console.log("");
  process.stdout.moveCursor(0, -1);
  process.stdout.clearLine(1);

  if (lastMessage?.from == from) {
    if (messagesLines.length == 1) {
      const mensaje = messagesLines[0];
      const espaciosAdicionales = 54 - mensaje.length;
      console.log(`${espaciado}${" ".repeat(espaciosAdicionales)}${mensaje}`);
    } else {
      var longestMessage = 0;
      messagesLines.forEach((m) => {
        longestMessage = m.length > longestMessage ? m.length : longestMessage;
      });

      const espaciosAdicionales = 54 - longestMessage;
      messagesLines.forEach((m) => {
        console.log(`${espaciado}${" ".repeat(espaciosAdicionales)}${m}`);
      });
    }
  } else {
    lastMessage.from = from;
    console.log(`${espaciado}${espaciado}Tú:`);
    if (messagesLines.length == 1) {
      const mensaje = messagesLines[0];
      const espaciosAdicionales = 54 - mensaje.length;
      console.log(`${espaciado}${" ".repeat(espaciosAdicionales)}${mensaje}`);
    } else {
      var longestMessage = 0;
      messagesLines.forEach((m) => {
        longestMessage = m.length > longestMessage ? m.length : longestMessage;
      });

      const espaciosAdicionales = 54 - longestMessage;
      messagesLines.forEach((m) => {
        console.log(`${espaciado}${" ".repeat(espaciosAdicionales)}${m}`);
      });
    }
  }
}

function imprimirMensajeAjeno(data) {
  const message = data.message;
  const from = data.from;

  const messagesLines = (message.match(/.{1,54}$|.{1,54} +/g) || []).map((s) =>
    s.trim()
  );

  console.log("");
  process.stdout.moveCursor(0, -1);
  process.stdout.clearLine(1);

  if (lastMessage?.from == from) {
    if (messagesLines.length == 1) {
      const mensaje = messagesLines[0];
      console.log(`\t${mensaje}`);
    } else {
      messagesLines.forEach((m) => {
        console.log(`\t${m}`);
      });
    }
  } else {
    lastMessage.from = from;
    console.log(`${from}:`);
    if (messagesLines.length == 1) {
      const mensaje = messagesLines[0];
      console.log(`\t${mensaje}`);
    } else {
      var longestMessage = 0;
      messagesLines.forEach((m) => {
        longestMessage = m.length > longestMessage ? m.length : longestMessage;
      });

      messagesLines.forEach((m) => {
        console.log(`\t${m}`);
      });
    }
  }
}

function esGrupo(to) {
  return to.charAt(0) == "g";
}

async function cargarChatsViejos(chatID) {
  const url = `${SERVER}/chat?from=${numeroTelefono}&to=${chatID}`; //54 9 11 6947-5274
  const response = await HttpUtils.get(url);
  const responseBody = await response.json();

  responseBody.forEach((mensaje) => {
    mensaje.from == numeroTelefono
      ? imprimirMensajePropio(mensaje)
      : imprimirMensajeAjeno(mensaje);
  });
}

async function enviarMensaje(messageInfo) {
  const url = `${SERVER}/mensaje`;

  const data = {
    from: numeroTelefono,
    to: messageInfo.to,
    message: messageInfo.message,
  };
  const response = await HttpUtils.post(url, data);
  if (response.status === 200) {
    return await response.json();
  }
  return undefined;
}

async function enviarMensajeSeguro(messageInfo, timeToLive) {
  const url = `${SERVER}/mensaje/secure`;

  const data = {
    from: numeroTelefono,
    to: messageInfo.to,
    message: messageInfo.message,
    timeToLive: timeToLive,
  };
  const response = await HttpUtils.post(url, data);
  if (response.status === 200) {
    return await response.json();
  }
  return undefined;
}

async function eliminarMensaje(messageID, chatID) {
  const url = `${SERVER}/mensaje?from=${numeroTelefono}&to=${messageID}&idx=${chatID}`;

  const response = await HttpUtils.del(url);
  if (response.status === 200) {
    return true;
  }
  return undefined;
}

async function editarMensaje(messageInfo, timeToLive) {
  const url = `${SERVER}/mensaje`;

  const data = {
    from: numeroTelefono,
    to: messageInfo.to,
    message: messageInfo.message,
    timeToLive: timeToLive,
  };
  const response = await HttpUtils.put(url, data);
  if (response.status === 200) {
    return await response.json();
  }
  return undefined;
}

async function agregarUsuarioAlGrupo(userNumber, groupID) {
  const url = `${SERVER}/agregarIntegrante`; //54 9 11 6947-5274

  const data = {
    from: numeroTelefono,
    to: groupID,
    nroIntegrante: userNumber,
  };
  const response = await HttpUtils.post(url, data);
  if (response.status === 200) {
    return await response.json();
  }
  return undefined;
}

async function eliminarUsuarioDeGrupo(userNumber, groupID) {
  const url = `${SERVER}/agregarIntegrante?from=${numeroTelefono}&to=${groupID}&integrante=${userNumber}`;

  const response = await HttpUtils.del(url);
  if (response.status === 200) {
    return true;
  }
  return undefined;
}

async function ascenderAdmin(userNumber, groupID) {
  const url = `${SERVER}/agregarIntegrante`; //54 9 11 6947-5274

  const data = {
    from: numeroTelefono,
    to: groupID,
    nroIntegrante: userNumber,
  };
  const response = await HttpUtils.put(url, data);
  if (response.status === 200) {
    return await response.json();
  }
  return undefined;
}
