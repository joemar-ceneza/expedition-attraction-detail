// next.config.js
module.exports = {
  images: {
    domains: ["api.expeditionlapland.com"], // Add your domain here
    // Alternatively, use remotePatterns for more control:
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.expeditionlapland.com",
        port: "",
        pathname: "/uploads/**", // Allows all images in uploads directory
      },
    ],
  },
};
