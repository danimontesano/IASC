import { initApp } from "./components/menu.js";
import { lecturaMenu } from "./components/lecturaMenu.js";
import { envioDeMensajes } from "./components/envioDeMensajes.js";
import { receptorDeMensajes } from "./components/receptorDeMensajes.js";
import cluster from "cluster";
import * as HttpUtils from "./utils/utils.js";

const port = process.argv[2];
const numeroTelefono = process.argv[3];

if (cluster.isPrimary) {
  const body = {
    url: "http://localhost:" + port,
    nroTelefono: numeroTelefono,
  };

  await HttpUtils.post("http://localhost:5100/registrarCliente", body);

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
