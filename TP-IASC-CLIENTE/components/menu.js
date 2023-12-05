//import promptSync from "prompt-sync";
//const prompt = promptSync({ sigint: true, output: process.stderr });
import { chat, imprimirMensajeAjeno, imprimirNotificacion } from "./chat.js";
import cluster from "cluster";

let chatID = null;

const contactos = ["Maxi Af", "Elo", "Maxi Arr", "Dani"];
const grupos = ["Grupo de gente crack", "Grupo con Maxi Af"];
const longitudContactos = contactos.length;
const longitudGrupos = grupos.length;
const longitudMaxima =
  longitudContactos > longitudGrupos ? longitudContactos : longitudGrupos;

export function initApp(numeroTelefono) {
  const receptorDeMensajes = cluster.fork({
    TYPE: "receptorDeMensajes",
  });

  receptorDeMensajes.on("message", (jsonData) => {
    if (jsonData.to === chatID) {
      imprimirMensajeAjeno(jsonData);
    } else {
      imprimirNotificacion(jsonData);
    }
  });

  menu(numeroTelefono);
}

export function menu(numeroTelefono) {
  process.stdout.write("\x1bc");

  const lecturaMenu = cluster.fork({
    TYPE: "lecturaMenu",
  });
  lecturaMenu.on("message", (asignarChat) => {
    chatID = asignarChat;
    lecturaMenu.kill();
    chat(chatID, numeroTelefono);
  });
  lecturaMenu.on("exit", (code, signal) => {
    //console.log("exit");
    lecturaMenu.kill(); // TODO: CHECKEAR
    if (code == 130) {
      process.exit();
    }
  });

  console.log(
    "Escribí el código del contacto o grupo con quien desees hablar:"
  );
  console.log("");
  console.log(
    "Contactos:                                                            Grupos:"
  );

  for (var i = 0; i < longitudMaxima; i++) {
    var stringContacto = "";
    var stringGrupo = "";
    if (i < longitudContactos) {
      stringContacto = `${i}. ${contactos[i]}`;
    }
    if (i < longitudGrupos) {
      const espaciosAdicionales = 70 - stringContacto.length;
      stringGrupo = `${" ".repeat(espaciosAdicionales)}g${i}. ${grupos[i]}`;
    }

    console.log(stringContacto + stringGrupo);
  }
  console.log("\n");

  /*const chatID = prompt(">");
  chat(chatID, numeroTelefono);*/
}
