import promptSync from "prompt-sync";
const prompt = promptSync({ sigint: true, output: process.stderr });
const to = process.env.CONTACT;
var numeroTelefono;

export function envioDeMensajes(numero) {
  numeroTelefono = numero;
  while (1) {
    //Ingresamos texto por consola
    const message = prompt(">");

    process.stdout.moveCursor(0, -1);
    process.stdout.clearLine(1);

    if (message.trim() == "/exit") {
      enviarMensaje(message);
      break;
    } else {
      enviarMensaje(message);
    }
  }
}

function enviarMensaje(mensaje) {
  const data = {
    from: numeroTelefono,
    to: to,
    message: mensaje,
  };
  process.send(data);
}
