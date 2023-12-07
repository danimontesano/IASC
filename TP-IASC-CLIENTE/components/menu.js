//import promptSync from "prompt-sync";
//const prompt = promptSync({ sigint: true, output: process.stderr });
import {
  chat,
  imprimirMensajeAjeno,
  imprimirNotificacion,
  esGrupo,
} from "./chat.js";
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
    if (esGrupo(jsonData.to)) {
      if (jsonData.to === chatID) {
        imprimirMensajeAjeno(jsonData);
      } else {
        imprimirNotificacion(jsonData);
      }
    } else {
      if (jsonData.from === chatID) {
        imprimirMensajeAjeno(jsonData);
      } else {
        imprimirNotificacion(jsonData);
      }
    }
  });

  menu(numeroTelefono);
}

export function menu(numeroTelefono) {
  process.stdout.write("\x1bc");
  chatID = null;

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

  console.log("Comandos para los chats:");
  console.log(
    "                              /exit                                        Salir del chat"
  );
  console.log(
    "                              /delete [Mensaje ID]                         Eliminar un mensaje"
  );
  console.log(
    "                              /edit [Mensaje ID] [Mensaje actualizado]     Editar un mensaje"
  );
  console.log(
    "                              /secure [Segundos] [Mensaje]                 Enviar un mensaje temporal"
  );
  console.log(
    "                            ┏ /add [Telefono]                              Agregar a un participante al grupo"
  );
  console.log(
    "      comandos de grupos ━━━╋ /expel [Telefono]                            Eliminar a un participante del grupo"
  );
  console.log(
    "                            ┗ /admin [Telefono]                            Ascender a un usuario a admin"
  );
  console.log("");
  console.log("");
  console.log("");
  console.log("¡Hola " + numeroTelefono + "! ✋");
  console.log("Ingrese el contacto o grupo con quien desees hablar:");

  /*
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
  console.log("\n");*/

  /*const chatID = prompt(">");
  chat(chatID, numeroTelefono);*/
}
