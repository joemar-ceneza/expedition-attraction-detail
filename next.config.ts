module.exports = {
  images: {
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
