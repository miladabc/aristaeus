FROM node:alpine
WORKDIR '/app'
RUN apk --no-cache add --virtual builds-deps build-base python
COPY ./package.json ./
RUN npm install --production
RUN npm rebuild bcrypt --build-from-source
COPY . .
CMD ["npm", "start"]