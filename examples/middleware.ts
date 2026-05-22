import { Emitter } from "../src/classes/sources/Emitter";
import { Middleware } from "../src/classes/boundary/Middleware";

type AppEvents = {
    login: { user: string };
    logout: {};
};

const emitter = new Emitter<AppEvents>();

const logger = new Middleware(emitter, ["login", "logout"], (t) => {
    console.log("Action fired:", t);
});

emitter.emit("login", { user: "Alice" });
emitter.emit("logout", {});

logger.destroy();
logger.destroy();
