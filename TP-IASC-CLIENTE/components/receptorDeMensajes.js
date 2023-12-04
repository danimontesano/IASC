import express from "express";
const app = express(); //Instantiate an express app, the main work horse of this server
app.use(express.json());

export async function receptorDeMensajes(port) {
  app.listen(port, () => {
    // console.log(`worker process ${process.pid} is listening on port ${port}`);
  });

  app.post("/", (req, res) => {
    process.send(req.body);
    res.sendStatus(200);
  });
}
