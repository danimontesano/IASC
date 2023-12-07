docker build -t datos .

docker run -it -e IP=%1 -e PUERTO=%2 -e IP_ORQUESTADOR=%3 -e PUERTO_ORQUESTADOR=%4 -p %2:%2 datos