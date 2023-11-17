import { menu } from "./components/menu.js";
import { envioDeMensajes } from "./components/envioDeMensajes.js";
import { receptorDeMensajes } from "./components/receptorDeMensajes.js";
import cluster from "cluster";

if (cluster.isPrimary) {
  menu();
} else {
  switch (process.env.TYPE) {
    case "envioDeMensajes":
      envioDeMensajes();
      break;
    case "receptorDeMensajes":
      receptorDeMensajes();
      break;
    default:
  }
}
