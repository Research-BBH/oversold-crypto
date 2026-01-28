export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
  safelist: [
    { pattern: /(bg|text|border)-(red|orange|yellow|green|emerald|gray)-(400|500|600)/ },
    { pattern: /(bg|border)-(red|orange|yellow|green|emerald|gray)-500\/(10|20|30|40)/ },
  ],
}