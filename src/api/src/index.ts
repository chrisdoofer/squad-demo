import express from 'express';
import cors from 'cors';
import { patterns } from '../../web/src/data/patterns';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// List all patterns
app.get('/api/patterns', (req, res) => {
  const { category, complexity, tag } = req.query;

  let results = patterns;

  if (typeof category === 'string') {
    results = results.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase(),
    );
  }

  if (typeof complexity === 'string') {
    results = results.filter((p) => p.complexity === complexity);
  }

  if (typeof tag === 'string') {
    results = results.filter((p) => p.tags.includes(tag));
  }

  res.json(results);
});

// Get single pattern by id
app.get('/api/patterns/:id', (req, res) => {
  const pattern = patterns.find((p) => p.id === req.params.id);
  if (!pattern) {
    res.status(404).json({ error: 'Pattern not found' });
    return;
  }
  res.json(pattern);
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
