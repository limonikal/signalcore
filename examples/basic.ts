import { Emitter } from "../src/classes/sources/Emitter";

type AppEvents = {
    login: { user: string };
    logout: {};
    error: { code: number; message: string };
};

const emitter = new Emitter<AppEvents>();

emitter.on("login", (t) => console.log(`User: ${t.user}`));
emitter.emit("login", { user: "Alice" });

emitter.once("logout", () => console.log("Logged out"));
emitter.emit("logout", {});

const handler = (t: any) => {};
emitter.on("error", handler);
emitter.off("error", handler);

emitter.offAll("login");
emitter.clear();
