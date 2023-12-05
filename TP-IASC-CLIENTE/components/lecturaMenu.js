import promptSync from "prompt-sync";
const prompt = promptSync({ sigint: true, output: process.stderr });

export function lecturaMenu() {
  const mensaje = prompt(">");
  enviarMensaje(mensaje);
}

function enviarMensaje(mensaje) {
  process.send(mensaje);
}
