docker build -t orquestador .

docker run -it -e PUERTO=%1 -p %1:%1 orquestador