import promptSync from "prompt-sync";
const prompt = promptSync({ sigint: true, output: process.stderr });
import { chat } from "./chat.js";

const contactos = ["Maxi Af", "Elo", "Maxi Arr", "Dani"];
const grupos = ["Grupo de gente crack", "Grupo con Maxi Af"];
const longitudContactos = contactos.length;
const longitudGrupos = grupos.length;
const longitudMaxima =
  longitudContactos > longitudGrupos ? longitudContactos : longitudGrupos;

export function menu() {
  process.stdout.write("\x1bc");
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
  const chatID = prompt(">");
  console.log(chatID);
  chat(chatID);
}
