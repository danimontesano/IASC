import promptSync from "prompt-sync";
const prompt = promptSync({ sigint: true, output: process.stderr });

export async function lecturaMenu() {
  //await new Promise((resolve) => setTimeout(resolve, 10000));
  //console.log("AAAAA");
  const mensaje = prompt(">");
  enviarMensaje(mensaje);
}

function enviarMensaje(mensaje) {
  process.send(mensaje);
}
