import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  // Port linh hoạt:
  // - Mặc định 8081
  // - Có thể override bằng env: VITE_PORT hoặc PORT
  // - Hoặc chạy: npm run dev -- --port 5173 (Vite tự nhận)
  const port = Number(process.env.VITE_PORT || process.env.PORT || 8081);

  return {
    server: {
      // Để điện thoại truy cập bằng IPv4 LAN cho chắc
      host: true, // tương đương 0.0.0.0
      port,
      strictPort: true, // KHÔNG tự nhảy port (khuyến nghị để khỏi lệch CORS/flow)

      // API proxy cho development
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8888',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
      },

      // HTTPS dùng mkcert (chỉ bật ở dev)
      // https: isDev
      //   ? {
      //       key: fs.readFileSync(path.resolve(__dirname, "D:\\DACNTT\\A-microservices-based-e-learning-platform\\192.168.1.2+3-key.pem")),
      //       cert: fs.readFileSync(path.resolve(__dirname, "D:\\DACNTT\\A-microservices-based-e-learning-platform\\192.168.1.2+3.pem")),
      //     }
      //   : undefined,
    },

    plugins: [react()].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    build: {
      outDir: "dist",
      emptyOutDir: true,
      minify: "esbuild", // Dùng esbuild thay vì terser (nhanh hơn và built-in)
      target: "esnext",
    },
  };
});
