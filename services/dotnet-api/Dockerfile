FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY IAAS.Api.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app .
EXPOSE 5001
ENV ASPNETCORE_URLS=http://+:5001
ENTRYPOINT ["dotnet", "IAAS.Api.dll"]
