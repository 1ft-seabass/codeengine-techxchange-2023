FROM icr.io/codeengine/node:18-alpine
COPY package.json .
RUN npm install
RUN mkdir public
COPY public/ public/
COPY server.js .
EXPOSE 8080
CMD [ "node", "server.js" ]
