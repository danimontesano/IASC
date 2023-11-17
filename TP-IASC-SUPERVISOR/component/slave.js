import { masterNode } from "./master.js";
import * as net from "net";

export async function slaveNode(ip, port, hosts) {
  await checkHealth(ip, port);
  masterNode(hosts);
}

const TIME_OUT = 2500;
const ATTEMPTS = 5;

async function checkHealth(ip, port) {
  var fails = 0;
  while (fails < ATTEMPTS) {
    var sock = new net.Socket();
    sock.setTimeout(TIME_OUT);
    sock
      .on("connect", function () {
        console.log(ip + ":" + port + " is up.");
        sock.destroy();
        fails = 0;
      })
      .on("error", function (e) {
        console.log(ip + ":" + port + " is down: " + e.message);
        fails++;
      })
      .on("timeout", function (e) {
        console.log(ip + ":" + port + " is down: timeout");
        fails++;
      })
      .connect(port, ip);

    await new Promise((r) => setTimeout(r, TIME_OUT + 50));
  }
}
