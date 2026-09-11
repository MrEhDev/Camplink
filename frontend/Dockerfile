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

# Generar certificado SSL autofirmado para compatibilidad con Cloudflare modo Full y Flexible
RUN apk add --no-cache openssl && \
    mkdir -p /etc/ssl/certs && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout /etc/ssl/certs/selfsigned.key \
    -out /etc/ssl/certs/selfsigned.crt \
    -subj "/CN=camplinkapp.com"

# Aquí copio la configuración optimizada de Nginx con gzip, rutas SPA y proxy inverso
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Aquí copio la aplicación compilada de React
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
