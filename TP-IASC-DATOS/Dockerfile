# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Expose the port on which your app runs
EXPOSE 3000

# Define environment variables
ENV PORT=3000
ENV STATUS=

# Command to run your application
CMD ["node", "index.js"]