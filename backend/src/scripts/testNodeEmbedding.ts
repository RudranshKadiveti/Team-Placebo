import { pipeline, env } from '@xenova/transformers';

async function test() {
  console.log('Loading Xenova pipeline with progress callback...');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    progress_callback: (p: any) => console.log('Progress:', p.status, p.name || '', p.progress ? `${Math.round(p.progress)}%` : ''),
  });
  console.log('Pipeline loaded successfully!');
  const output = await extractor('Hello world, testing AI embedding pipeline', {
    pooling: 'mean',
    normalize: true,
  });
  const vector = Array.from(output.data);
  console.log('Embedding dimension:', vector.length);
  console.log('Sample vector values:', vector.slice(0, 5));
}

test().catch(console.error);
