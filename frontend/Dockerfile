# Aquí configuro la construcción multietapa para la SPA de Camplink:
# Etapa 1: compilo la aplicación con Node.js y Vite.
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: sirvo los archivos estáticos optimizados mediante Nginx en Linux
FROM nginx:alpine

# Aquí copio la configuración optimizada de Nginx con gzip, rutas SPA y proxy inverso
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Aquí copio la aplicación compilada de React
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
