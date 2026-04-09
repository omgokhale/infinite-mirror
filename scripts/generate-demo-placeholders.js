const fs = require('fs');
const path = require('path');

const demoDir = path.join(__dirname, '../public/demo');

if (!fs.existsSync(demoDir)) {
  fs.mkdirSync(demoDir, { recursive: true });
}

function generateSVG(index, total) {
  const hue = (index / total) * 60;
  const saturation = 70 + (index * 2);
  const lightness = 50 - (index * 1.5);

  const noiseAmount = index * 3;
  const circles = [];

  for (let i = 0; i < 20 + index * 5; i++) {
    const cx = 100 + Math.sin(i * 0.5 + index) * (300 + index * 10);
    const cy = 100 + Math.cos(i * 0.7 + index) * (300 + index * 10);
    const r = 50 + Math.sin(i + index) * 30;
    const opacity = 0.1 + (index * 0.02);
    const fill = `hsl(${hue + i * 5}, ${saturation}%, ${lightness + 20}%)`;
    circles.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"/>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="hsl(${hue}, ${saturation}%, ${lightness}%)"/>
  ${circles.join('\n  ')}
  <text x="512" y="512" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.3">
    ${index === 0 ? 'Original' : `Iteration ${index}`}
  </text>
  <text x="512" y="580" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.2">
    Demo Placeholder
  </text>
</svg>`;
}

for (let i = 0; i <= 10; i++) {
  const svg = generateSVG(i, 10);
  const filename = `iteration-${String(i).padStart(3, '0')}.svg`;
  fs.writeFileSync(path.join(demoDir, filename), svg);
  console.log(`Generated ${filename}`);
}

const manifest = {
  id: "demo-run",
  createdAt: new Date().toISOString(),
  iterationCount: 11,
  images: Array.from({ length: 11 }, (_, i) => `iteration-${String(i).padStart(3, '0')}.svg`)
};

fs.writeFileSync(
  path.join(demoDir, 'run.json'),
  JSON.stringify(manifest, null, 2)
);

console.log('\\nDemo placeholders generated successfully!');
console.log('Note: Replace these with real generated images for production.');
