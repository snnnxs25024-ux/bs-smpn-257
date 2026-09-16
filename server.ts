import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
const PORT = 3000;

let rawUrl = process.env.SUPABASE_URL || 'https://qavcgqftxomlcdfpbuxa.supabase.co';
if (rawUrl.endsWith('/rest/v1/')) {
  rawUrl = rawUrl.replace('/rest/v1/', '');
} else if (rawUrl.endsWith('/rest/v1')) {
  rawUrl = rawUrl.replace('/rest/v1', '');
}
const supabaseUrl = rawUrl;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

app.delete('/api/students', async (req, res) => {
  const { error: err1 } = await supabase.from('students').delete().neq('id', '0');
  const { error: err2 } = await supabase.from('records').delete().neq('id', '0');
  if (err1) console.error(err1);
  if (err2) console.error(err2);
  res.json({ success: true });
});

// Students Endpoints
app.get('/api/students', async (req, res) => {
  const { data, error } = await supabase.from('students').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/students', async (req, res) => {
  const { students } = req.body;
  if (!students || !Array.isArray(students)) return res.status(400).json({ error: 'Invalid students data' });
  
  const { data, error } = await supabase.from('students').upsert(students);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Records Endpoints
app.get('/api/records', async (req, res) => {
  const { data, error } = await supabase.from('records').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/records', async (req, res) => {
  const { records } = req.body;
  if (!records || !Array.isArray(records)) return res.status(400).json({ error: 'Invalid records data' });
  
  const { data, error } = await supabase.from('records').upsert(records);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
