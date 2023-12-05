import { initApp } from "./components/menu.js";
import { lecturaMenu } from "./components/lecturaMenu.js";
import { envioDeMensajes } from "./components/envioDeMensajes.js";
import { receptorDeMensajes } from "./components/receptorDeMensajes.js";
import cluster from "cluster";
import * as HttpUtils from "./utils/utils.js";

const ip = process.argv[2];
const port = process.argv[3];
const orquestadorIp = process.argv[4];
const orquestadorPort = process.argv[5];
const numeroTelefono = process.argv[6];

if (cluster.isPrimary) {
  const body = {
    url: "http://" + ip + ":" + port,
    nroTelefono: numeroTelefono,
  };

  await HttpUtils.post(
    "http://" + orquestadorIp + ":" + orquestadorPort + "/registrarCliente",
    body
  );

  initApp(numeroTelefono);
} else {
  switch (process.env.TYPE) {
    case "lecturaMenu":
      lecturaMenu();
      break;
    case "envioDeMensajes":
      envioDeMensajes(numeroTelefono);
      break;
    case "receptorDeMensajes":
      receptorDeMensajes(port);
      break;
    default:
  }
}
