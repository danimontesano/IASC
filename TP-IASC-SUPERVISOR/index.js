import { masterNode } from "./component/master.js";
import { slaveNode } from "./component/slave.js";

var hosts = [["192.168.1.171", 5010]];

const primaryIp = process.argv[2];
const primaryPort = process.argv[3];

if (!primaryIp || !primaryPort) {
  console.log("Es maestro");
  masterNode(hosts);
} else if (validIpPort(primaryIp, primaryPort)) {
  console.log("Es esclavo");
  slaveNode(primaryIp, primaryPort, hosts);
} else {
  console.log("Parametros no válidos");
}

function validIpPort(ipaddress, port) {
  port = Number(port);
  if (
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      ipaddress
    ) &&
    port &&
    port > 0 &&
    port < 65535
  ) {
    return true;
  }
  return false;
}
