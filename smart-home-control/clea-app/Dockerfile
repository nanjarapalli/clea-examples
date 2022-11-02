#=========================================================================================
#  File Name: Dockerfile
#  Description: Docker Deployment file Data service
#  ----------------------------------------------------------------------------------------
#  Item Name: Clea_HOME_DEMO_APP
#  Author: Rajesh Reddy Nanjarapalli (rajesh.reddy@secomind.com)
#==========================================================================================
FROM node:16 as builder

WORKDIR /app
ADD package*.json ./
RUN npm ci
ADD . .
RUN npm run build

FROM nginx:1
COPY --from=builder /app/dist/main.js /usr/share/nginx/html/App.js
ADD nginx.conf /etc/nginx/conf.d/default.conf
