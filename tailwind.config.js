export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { 
    extend: {
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
      }
    } 
  },
  plugins: [],
  safelist: [
    { pattern: /(bg|text|border)-(red|orange|yellow|green|emerald|gray)-(400|500|600)/ },
    { pattern: /(bg|border)-(red|orange|yellow|green|emerald|gray)-500\/(10|20|30|40|50)/ },
    { pattern: /shadow-(red|orange|yellow|green|emerald|gray)-500\/(10|20|30)/ },
    'border-2',
    'grid-cols-13',
  ],
}
