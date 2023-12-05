# Stage 1: Build stage
FROM node:16.16.0 AS builder

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Stage 2: Run stage
FROM node:16.16.0-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy only the necessary files from the previous stage
COPY --from=builder /usr/src/app .

# Define environment variables
ENV PUERTO=5100

EXPOSE $PUERTO

# Command to run your application
CMD ["node", "index.js"]
