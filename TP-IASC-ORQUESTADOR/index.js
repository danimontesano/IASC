import { masterNode } from "./component/orquestador.js";

const port = process.argv[2];

var IP_ORQUESTADOR_SECUNDARIO = process.argv[3];
var PUERTO_ORQUESTADOR_SECUNDARIO = process.argv[4];
//const port = process.env.PUERTO;

if (validPort(port)) {
  if (validIpPort(IP_ORQUESTADOR_SECUNDARIO, PUERTO_ORQUESTADOR_SECUNDARIO)) {
    slaveNode(IP_ORQUESTADOR_SECUNDARIO, PUERTO_ORQUESTADOR_SECUNDARIO);
  } else {
    masterNode(port);
  }
} else {
  console.log("Parametros no válidos");
}

function validPort(port) {
  port = Number(port);
  return port && port > 0 && port < 65535 ? true : false;
}

function validIpPort(ipaddress, port) {
  port = Number(port);
  if (
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      ipaddress
    ) &&
    validPort(port)
  ) {
    return true;
  }
  return false;
}
