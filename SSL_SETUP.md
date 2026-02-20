# Configuración SSL/TLS 256-bit para PsicoApp

## Requisitos de Seguridad

Esta aplicación requiere SSL/TLS con cifrado de 256 bits para cumplir con estándares de seguridad para aplicaciones médicas/psicológicas y RGPD.

## Configuración SSL/TLS

### 1. Generar Certificado SSL

#### Opción A: Certificado autofirmado (solo desarrollo)

```bash
# Generar keystore PKCS12 con certificado autofirmado
keytool -genkeypair -alias psicoapp -keyalg RSA -keysize 4096 \
  -keystore src/main/resources/keystore.p12 -storetype PKCS12 \
  -validity 365 -storepass changeit -keypass changeit \
  -dname "CN=localhost, OU=Development, O=PsicoApp, L=City, ST=State, C=ES"
```

#### Opción B: Certificado de CA (producción)

Para producción, obtén un certificado SSL válido de una CA reconocida (Let's Encrypt, DigiCert, etc.):

```bash
# Convertir certificado a PKCS12
openssl pkcs12 -export -in certificate.crt -inkey private.key \
  -out src/main/resources/keystore.p12 -name psicoapp \
  -password pass:YOUR_PASSWORD
```

### 2. Configurar Variables de Entorno

En producción, configura las siguientes variables de entorno:

```bash
# Contraseña del keystore SSL
export SSL_KEYSTORE_PASSWORD=tu_password_seguro_aqui

# JWT Secret (mínimo 32 bytes = 256 bits)
export JWT_SECRET=$(openssl rand -base64 32)
```

### 3. Configuración de Spring Boot

El archivo `application-prod.yml.example` contiene la configuración SSL/TLS necesaria:

- **Puerto**: 8443 (HTTPS)
- **Protocolos**: Solo TLSv1.2 y TLSv1.3
- **Cipher Suites**: Solo suites con cifrado 256-bit
- **Tipo de keystore**: PKCS12

### 4. Verificar Configuración SSL

```bash
# Verificar que el servidor está usando TLS correctamente
openssl s_client -connect localhost:8443 -tls1_2

# Verificar cipher suites disponibles
nmap --script ssl-enum-ciphers -p 8443 localhost
```

### 5. Configuración de Reverse Proxy (Nginx)

Si usas Nginx como reverse proxy, configura SSL también allí:

```nginx
server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    # Certificados SSL
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Configuración SSL/TLS 256-bit
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-SHA384:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-SHA256:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-CHACHA20-POLY1305';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass https://localhost:8443;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name tu-dominio.com;
    return 301 https://$server_name$request_uri;
}
```

## Verificación de Seguridad

### Checklist SSL/TLS

- [ ] Certificado SSL válido instalado
- [ ] Solo TLSv1.2 y TLSv1.3 habilitados
- [ ] Solo cipher suites con cifrado 256-bit permitidas
- [ ] JWT_SECRET tiene al menos 32 bytes (256 bits)
- [ ] SSL_KEYSTORE_PASSWORD configurado en variables de entorno
- [ ] HTTP redirigido a HTTPS
- [ ] Headers de seguridad configurados (HSTS, etc.)

### Herramientas de Verificación

- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Mozilla SSL Configuration Generator**: https://ssl-config.mozilla.org/
- **Qualys SSL Test**: https://www.ssllabs.com/ssltest/

## Notas Importantes

1. **Nunca** commits el keystore o contraseñas en el repositorio
2. En producción, usa certificados de CA reconocida
3. Rota el JWT_SECRET periódicamente
4. Monitorea los logs de auditoría para accesos no autorizados
5. Configura backup automático de logs de auditoría RGPD
