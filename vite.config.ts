import { defineConfig } from "vite";
import path from "path";
import dts from "vite-plugin-dts";

export function r(src: string) {
    return path.resolve(__dirname, src);
}

export default defineConfig({
    resolve: {
        alias: {
            "@": r("./src/"),
            "@hooks": r("./src/hooks/"),
            "@classes": r("./src/classes/"),
        },
    },
    plugins: [
        dts({
            insertTypesEntry: true,
            include: ["src/**/*"],
            outDirs: "dist",
        })
    ],
});
