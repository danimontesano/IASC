import ioClient from "socket.io-client";

function slaveNode(IP_ORQUESTADOR_SECUNDARIO, PUERTO_ORQUESTADOR_SECUNDARIO) {
  const urlOrquestadorSecundario =
    "http://" + IP_ORQUESTADOR_SECUNDARIO + ":" + PUERTO_ORQUESTADOR_SECUNDARIO;

  const socket = ioClient.connect(urlOrquestadorSecundario, {
    query: {
      type: "HII-SECUNDARIO",
      url: MY_URL,
    },
  });
}
