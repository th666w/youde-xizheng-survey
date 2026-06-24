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

// Serve static frontend
app.use(express.static(path.join(__dirname, '../dist')));

// JSON file-based storage
const DATA_DIR = path.join(__dirname, '../data');
const RESULTS_FILE = path.join(DATA_DIR, 'results.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(RESULTS_FILE)) fs.writeFileSync(RESULTS_FILE, '[]', 'utf-8');

function readResults(): any[] {
  try {
    return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
  } catch { return []; }
}

function writeResults(data: any[]) {
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// POST /api/results - Save survey result
app.post('/api/results', (req, res) => {
  try {
    const { grade, totalScore, maxScore, ratio, dimensionScores, answers, respondentName, respondentPhone } = req.body;
    if (!grade || totalScore === undefined || !dimensionScores || !answers) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const results = readResults();
    const newResult = {
      id: results.length > 0 ? results[results.length - 1].id + 1 : 1,
      grade,
      total_score: totalScore,
      max_score: maxScore,
      ratio,
      dimension_scores: dimensionScores,
      answers,
      respondent_name: respondentName || '',
      respondent_phone: respondentPhone || '',
      submitted_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    results.push(newResult);
    writeResults(results);

    res.json({ success: true, id: newResult.id });
  } catch (err) {
    console.error('保存失败:', err);
    res.status(500).json({ error: '保存失败' });
  }
});

// GET /api/results - List all results
app.get('/api/results', (req, res) => {
  try {
    const gradeFilter = req.query.grade as string;
    let results = readResults();
    if (gradeFilter) {
      results = results.filter((r: any) => r.grade === gradeFilter);
    }
    results.reverse(); // newest first
    res.json({ total: results.length, data: results });
  } catch (err) {
    res.status(500).json({ error: '查询失败' });
  }
});

// GET /api/results/stats - Stats
app.get('/api/results/stats', (req, res) => {
  try {
    const results = readResults();
    const total = results.length;
    const gradeCount: Record<string, number> = {};
    let totalRatio = 0;

    results.forEach((r: any) => {
      gradeCount[r.grade] = (gradeCount[r.grade] || 0) + 1;
      totalRatio += r.ratio;
    });

    // Dimension averages
    const dimAccum: Record<string, { score: number; max: number; count: number }> = {};
    results.forEach((r: any) => {
      (r.dimension_scores || []).forEach((d: any) => {
        if (!dimAccum[d.label]) dimAccum[d.label] = { score: 0, max: 0, count: 0 };
        dimAccum[d.label].score += d.score;
        dimAccum[d.label].max += d.maxScore;
        dimAccum[d.label].count += 1;
      });
    });

    const dimensionAvg = Object.entries(dimAccum).map(([label, data]) => ({
      label,
      avgScore: data.count > 0 ? Math.round((data.score / data.max) * 100) : 0,
      count: data.count,
    }));

    res.json({
      total,
      avgRatio: total > 0 ? Math.round(totalRatio / total) : 0,
      gradeCount,
      dimensionAvg,
    });
  } catch (err) {
    res.status(500).json({ error: '统计失败' });
  }
});

// DELETE /api/results/:id
app.delete('/api/results/:id', (req, res) => {
  try {
    const results = readResults();
    const filtered = results.filter((r: any) => r.id !== parseInt(req.params.id));
    if (filtered.length === results.length) {
      return res.status(404).json({ error: '未找到该记录' });
    }
    writeResults(filtered);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除失败' });
  }
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist-admin/index.html'));
});

// Fallback to frontend SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`📊 后台管理: http://localhost:${PORT}/admin`);
});
