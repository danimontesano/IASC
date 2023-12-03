import { menu } from "./components/menu.js";
import { envioDeMensajes } from "./components/envioDeMensajes.js";
import { receptorDeMensajes } from "./components/receptorDeMensajes.js";
import cluster from "cluster";

const port = process.argv[2];
const numeroTelefono = process.argv[3];

if (cluster.isPrimary) {
  menu(numeroTelefono);
} else {
  switch (process.env.TYPE) {
    case "envioDeMensajes":
      envioDeMensajes(numeroTelefono);
      break;
    case "receptorDeMensajes":
      receptorDeMensajes(port);
      break;
    default:
  }
}
