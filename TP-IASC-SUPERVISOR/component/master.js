import express from "express";
const app = express();
import * as net from "net";

const TIME_OUT = 2500;

export async function masterNode(hosts) {
  app.listen(5000, () => {
    console.log(`worker process ${process.pid} is listening on port 5000`);
  });

  while (1) {
    console.log("");
    console.log(
      "-------------------------------------------------------------"
    );
    console.log("");

    hosts.forEach(function (item) {
      var sock = new net.Socket();
      sock.setTimeout(TIME_OUT);
      sock
        .on("connect", function () {
          console.log(item[0] + ":" + item[1] + " is up.");
          sock.destroy();
        })
        .on("error", function (e) {
          console.log(item[0] + ":" + item[1] + " is down: " + e.message);
        })
        .on("timeout", function (e) {
          console.log(item[0] + ":" + item[1] + " is down: timeout");
        })
        .connect(item[1], item[0]);
    });

    await new Promise((r) => setTimeout(r, TIME_OUT + 50));
  }
}
