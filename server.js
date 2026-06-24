import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const DIST = path.join(__dirname, 'dist');
app.use(express.static(DIST));

const DATA_DIR = path.join(__dirname, 'data');
const RESULTS_FILE = path.join(DATA_DIR, 'results.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(RESULTS_FILE)) fs.writeFileSync(RESULTS_FILE, '[]', 'utf-8');

function read() { try { return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8')); } catch { return []; } }
function write(d) { fs.writeFileSync(RESULTS_FILE, JSON.stringify(d, null, 2), 'utf-8'); }

app.post('/api/results', (req, res) => {
  try {
    const { grade, totalScore, maxScore, ratio, dimensionScores, answers, respondentName, respondentPhone } = req.body;
    if (!grade || totalScore === undefined) return res.status(400).json({ error: '缺少必填字段' });
    const r = read();
    const n = { id: r.length > 0 ? r[r.length - 1].id + 1 : 1, grade, total_score: totalScore, max_score: maxScore, ratio, dimension_scores: dimensionScores, answers, respondent_name: respondentName || '', respondent_phone: respondentPhone || '', submitted_at: new Date().toISOString().replace('T', ' ').slice(0, 19) };
    r.push(n); write(r);
    res.json({ success: true, id: n.id });
  } catch (e) { res.status(500).json({ error: '保存失败' }); }
});

app.get('/api/results', (req, res) => {
  try {
    let r = read();
    const g = req.query.grade;
    if (g) r = r.filter(x => x.grade === g);
    r.reverse();
    res.json({ total: r.length, data: r });
  } catch (e) { res.status(500).json({ error: '查询失败' }); }
});

app.get('/api/results/stats', (req, res) => {
  try {
    const r = read(); const total = r.length; const gc = {}; let tr = 0;
    r.forEach(x => { gc[x.grade] = (gc[x.grade] || 0) + 1; tr += x.ratio; });
    const da = {};
    r.forEach(x => (x.dimension_scores || []).forEach(d => { if (!da[d.label]) da[d.label] = { score: 0, max: 0, count: 0 }; da[d.label].score += d.score; da[d.label].max += d.maxScore; da[d.label].count += 1; }));
    const dimAvg = Object.entries(da).map(([label, data]) => ({ label, avgScore: data.count > 0 ? Math.round((data.score / data.max) * 100) : 0, count: data.count }));
    res.json({ total, avgRatio: total > 0 ? Math.round(tr / total) : 0, gradeCount: gc, dimensionAvg: dimAvg });
  } catch (e) { res.status(500).json({ error: '统计失败' }); }
});

app.delete('/api/results/:id', (req, res) => {
  try { const r = read(); const f = r.filter(x => x.id !== parseInt(req.params.id)); if (f.length === r.length) return res.status(404).json({ error: '未找到' }); write(f); res.json({ success: true }); } catch (e) { res.status(500).json({ error: '删除失败' }); }
});

// Admin page
app.get('/admin', (req, res) => res.sendFile(path.join(DIST, 'admin', 'index.html')));

// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
