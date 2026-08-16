import { Server } from "http";
import app from "./app";
import config from "./config";
const port = Number(config.port) || 5000;

async function main() {
    const server: Server = app.listen(port, "0.0.0.0", () => {
        console.log("Server is running on port", port, "- Live Reload Active!");
    });
}
main();
// Reloaded brand endpoints and authorization rules

