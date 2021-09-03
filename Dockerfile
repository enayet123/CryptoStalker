FROM node:latest

WORKDIR /app

# Setup application with pm2
RUN npm install pm2 -g
COPY . ./
RUN npm i

EXPOSE 3003

# Run application
CMD ["pm2-runtime", "app.js"]

