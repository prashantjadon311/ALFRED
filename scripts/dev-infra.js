const net = require("node:net");
const { spawnSync } = require("node:child_process");

function canConnect(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port, timeout: 1000 });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

function startNamedContainer(name) {
  return spawnSync("docker", ["start", name], { stdio: "inherit" }).status === 0;
}

function composeUp(service) {
  return spawnSync("docker", ["compose", "up", "-d", service], { stdio: "inherit" }).status === 0;
}

function containerExists(name) {
  return spawnSync("docker", ["inspect", name], { stdio: "ignore" }).status === 0;
}

function startService(service, containerName) {
  if (containerExists(containerName)) return startNamedContainer(containerName);
  return composeUp(service);
}

async function main() {
  let [mongoUp, redisUp] = await Promise.all([canConnect(27017), canConnect(6379)]);
  if (!mongoUp) {
    startService("mongodb", "alfred-mongodb");
  }
  if (!redisUp) {
    startService("redis", "alfred-redis");
  }

  [mongoUp, redisUp] = await Promise.all([canConnect(27017), canConnect(6379)]);
  if (mongoUp && redisUp) {
    console.log("MongoDB and Redis are already reachable on localhost ports 27017 and 6379.");
    return;
  }

  console.error(
    [
      "Docker infrastructure could not be started, and MongoDB/Redis were not both reachable.",
      `MongoDB reachable: ${mongoUp ? "yes" : "no"}`,
      `Redis reachable: ${redisUp ? "yes" : "no"}`,
      "Run `docker compose up -d mongodb redis` manually when backend integration is needed."
    ].join("\n")
  );
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
