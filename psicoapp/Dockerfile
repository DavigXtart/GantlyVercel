# Dockerfile para Railway
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copiar archivos de configuración de Maven primero (para aprovechar cache)
COPY psicoapp/pom.xml .
RUN mvn dependency:go-offline -B

# Copiar el código fuente
COPY psicoapp/src ./src

# Compilar la aplicación
RUN mvn clean package -DskipTests

# Imagen de ejecución
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Crear directorio para uploads y logs
RUN mkdir -p /app/uploads/avatars /app/uploads/tasks /app/logs

# Copiar el JAR desde la etapa de construcción
COPY --from=builder /app/target/*.jar app.jar

# Exponer el puerto (Railway puede cambiar esto con PORT env var)
EXPOSE 8080

# Usar variables de entorno para el puerto y otros ajustes
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Ejecutar la aplicación
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

