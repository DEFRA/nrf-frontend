FROM defradigital/node-development

ENV TZ="Europe/London"

COPY --chown=node:node package*.json ./
RUN npm install

COPY --chown=node:node server.js .

CMD ["node", "server.js"]
