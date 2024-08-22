# Stage 1: Build
FROM node:20 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM node:20

WORKDIR /app
COPY --from=build /app/.next /app/.next
COPY --from=build /app/public /app/public
COPY --from=build /app/package*.json /app/
COPY --from=build /app/node_modules /app/node_modules

EXPOSE 3000
CMD ["npm", "start"]
