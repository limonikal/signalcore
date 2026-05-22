import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

function resolve(src: string) {
    return path.resolve(__dirname, src);
}

export default defineConfig({
    resolve: {
        alias: {
            "@": resolve("./src/"),
            "@hooks": resolve("./src/hooks/"),
            "@classes": resolve("./src/classes/"),
        },
    },
    build: {
        lib: {
            entry: resolve("./src/index.ts"),
            name: "emitme",
            formats: ["es", "cjs", "umd"],
            fileName: (format) => {
                if (format === "es") return "index.esm.js";
                if (format === "cjs") return "index.cjs.js";
                return "index.umd.js";
            },
        },
        rollupOptions: {
            external: [],
        },
    },
    plugins: [
        dts({
            insertTypesEntry: true,
            include: ["src/**/*"],
            outDir: "dist",
        }),
    ],
});
