# Build Angular
FROM node:23 AS ng-build

WORKDIR /src

RUN npm i -g @angular/cli

COPY client/public public
COPY client/src src
COPY client/angular.json .
COPY client/package.json .
COPY client/package-lock.json .
COPY client/tsconfig.app.json .
COPY client/tsconfig.json .
COPY client/tsconfig.spec.json .

RUN npm ci
RUN ng build

# Build Java Spring-Boot

FROM openjdk:23-jdk AS j-build
ENV JAVA_TOOL_OPTIONS="-XX:UseSVE=0"

WORKDIR /src

COPY server/.mvn .mvn
COPY server/src src
COPY server/mvnw .
COPY server/pom.xml .

# Copy angular files over to static
COPY --from=ng-build /src/dist/client/browser/ src/main/resources/static

RUN ./mvnw package -Dmaven.test.skip=true

# Combine the JAR file over to the final container
FROM openjdk:23-jdk
ENV JAVA_TOOL_OPTIONS="-XX:UseSVE=0"

WORKDIR /app

COPY --from=j-build /src/target/server-0.0.1-SNAPSHOT.jar app.jar

ENV PORT=8080
ENV SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/day26workshop
ENV SPRING_DATA_MONGODB_DATABASE=finalProj

ENV SPRING_DATASOURCE_USERNAME=root
ENV SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/finalProj
ENV SPRING_DATASOURECE_PASSWORD=password

ENV EXERCISE_API_KEY=apikey
ENV EXERCISE_API_URL=apiUrl

ENV SPOTIFY_CLIENT_IDs=spotifyId
ENV SPOTIFY_CLIENT_SECRET=secretClient
ENV SPOTIFY_REDIRECT_URI=redirectURL

# Stripe API Configuration
ENV STRIPE_API_KEY=apiKey
ENV STRIP_WEBHOOK_SECRET=secretWebhook
ENV APP_URL=appURL

EXPOSE ${PORT}

SHELL ["/bin/sh","-c"]
ENTRYPOINT SERVER_PORT=${PORT} java -jar app.jar
