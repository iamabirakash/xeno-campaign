module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201b",
        muted: "#68746d",
        line: "#dfe6e2",
        soft: "#f4f7f5",
        moss: "#1f7a54",
        meadow: "#e7f4ee",
        signal: "#2764a8",
        amber: "#f3b33d"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(23, 32, 27, 0.08)"
      }
    }
  },
  plugins: []
};
