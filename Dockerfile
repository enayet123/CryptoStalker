FROM node:latest

WORKDIR /app

# Setup application with pm2
COPY . ./
RUN npm i

EXPOSE 3003

# Run application
CMD ["npm", "run", "start"]
