FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY .mvn .mvn
COPY mvnw pom.xml ./
COPY src src
RUN ./mvnw -B -DskipTests package && cp target/tpoDA-*.jar /auctionpro.jar

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /auctionpro.jar .
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "auctionpro.jar"]
