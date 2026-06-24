import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Button, Card, Tag, Progress, Input, MessagePlugin } from 'tdesign-react';
import { Question, AnswerMap, GradeKey } from '../App';

interface ResultViewProps {
  grade: GradeKey;
  questions: Question[];
  answers: AnswerMap;
  onRestart: () => void;
}

// Dimension name mapping for display
const DIMENSION_LABELS: Record<string, string> = {
  '生活记忆与家人关注': '家庭情感感知',
  '家庭认知与亲子联结': '家庭认知与亲子',
  '学习记忆与自我认知': '学习自我认知',
  '学业自我规划': '学业规划能力',
  '性格与情绪': '性格与情绪管理',
  '学习接受方式': '学习风格偏好',
  '学习动力与目标': '学习动力',
  '节奏与抗挫': '抗压与韧性',
  '注意力与娱乐': '注意力自律',
  '人际与价值倾向': '人际与价值观',
  '行为与习惯': '行为与习惯',
  '思维模式测评': '思维模式',
  '情感感知与人关注': '情感感知',
  '学习能力与自我认知': '学习自我认知',
  '性格特质': '性格特质',
  '学习接收方式': '学习方式',
  '焦虑与抗压': '抗压能力',
  '注意力与自律': '注意力自律',
  '人际交往与品德': '人际品德',
  '行为习惯': '行为习惯',
};

const DIMENSION_COLORS: Record<string, string> = {
  '家庭情感感知': '#FF9F43',
  '家庭认知与亲子': '#54A0FF',
  '学习自我认知': '#5F27CD',
  '学业规划能力': '#00D2D3',
  '性格与情绪管理': '#F368E0',
  '学习风格偏好': '#EE5A24',
  '学习动力与目标': '#0ABDE3',
  '抗压与韧性': '#10AC84',
  '注意力与自律': '#FF6B6B',
  '人际与价值观': '#48DBFB',
  '行为与习惯': '#FF9FF3',
  '思维模式': '#54A0FF',
  '情感感知': '#FF9F43',
  '性格特质': '#F368E0',
  '学习方式': '#EE5A24',
  '学习动力': '#0ABDE3',
  '抗压能力': '#10AC84',
  '注意力自律': '#FF6B6B',
  '人际品德': '#48DBFB',
  '行为习惯': '#FF9FF3',
};

// API endpoints to try - first try same origin, then fallback to tunnels
const API_BASES = [
  '',  // Same origin - works when frontend+backend are on the same server
  'https://survey-1782287360.loca.lt',
  'https://youde-survey-data.loca.lt',
  'https://youde-results.loca.lt',
  'https://youde-xizheng-survey.loca.lt',
];

async function fetchWithFallback(path: string, options: RequestInit): Promise<Response> {
  let lastError: Error | null = null;
  for (const base of API_BASES) {
    if (!base) {
      // Skip empty base if on EdgeOne (can't call relative API without functions)
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') continue;
    }
    try {
      const res = await fetch(base + path, { ...options, signal: AbortSignal.timeout(8000) });
      if (res.ok) return res;
    } catch (e) {
      lastError = e as Error;
      console.warn(`API fallback: ${base} failed`, e);
    }
  }
  throw lastError || new Error('All API endpoints failed');
}

function getLevel(score: number, maxScore: number): { label: string; color: string; desc: string } {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.8) return { label: '优秀', color: '#10AC84', desc: '表现非常出色，继续保持！' };
  else if (ratio >= 0.6) return { label: '良好', color: '#54A0FF', desc: '整体不错，有提升空间。' };
  else if (ratio >= 0.4) return { label: '一般', color: '#FF9F43', desc: '需要关注，建议加强培养。' };
  else return { label: '待提升', color: '#EE5A24', desc: '需要重点关注和引导。' };
}

export function ResultView({ grade, questions, answers, onRestart }: ResultViewProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  // Compute dimension scores
  const dimensionScores = useMemo(() => {
    const dimMap: Record<string, { score: number; count: number; maxScore: number }> = {};
    questions.forEach((q) => {
      const dim = q.dimension;
      if (!dimMap[dim]) dimMap[dim] = { score: 0, count: 0, maxScore: 0 };
      dimMap[dim].count += 1;
      dimMap[dim].maxScore += 2;
      const answer = answers[q.number];
      if (answer !== undefined) dimMap[dim].score += answer;
    });
    return Object.entries(dimMap).map(([dim, data]) => {
      const label = DIMENSION_LABELS[dim] || dim;
      const level = getLevel(data.score, data.maxScore);
      return { dim, label, score: data.score, maxScore: data.maxScore, ratio: data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0, level, color: DIMENSION_COLORS[label] || '#667eea' };
    });
  }, [questions, answers]);

  // Compute total score
  const totalScore = useMemo(() => {
    const total = dimensionScores.reduce((sum, d) => sum + d.score, 0);
    const maxTotal = dimensionScores.reduce((sum, d) => sum + d.maxScore, 0);
    return { score: total, max: maxTotal, ratio: maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0 };
  }, [dimensionScores]);

  const totalLevel = getLevel(totalScore.score, totalScore.max);

  const weakDimensions = useMemo(() => {
    return dimensionScores.filter((d) => d.ratio < 60).sort((a, b) => a.ratio - b.ratio);
  }, [dimensionScores]);

  // Auto-submit once on results page
  useEffect(() => {
    if (submittedRef.current) return;
    
    const savedId = sessionStorage.getItem(`submitted_${grade}_${Object.keys(answers).join(',')}`);
    if (savedId) {
      setSubmitted(true);
      setShowForm(false);
      return;
    }

    async function submitResult() {
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const res = await fetchWithFallback('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grade,
            totalScore: totalScore.score,
            maxScore: totalScore.max,
            ratio: totalScore.ratio,
            dimensionScores,
            answers,
            respondentName: name,
            respondentPhone: phone,
          }),
        });
        const data = await res.json();
        if (data.success) {
          sessionStorage.setItem(`submitted_${grade}_${totalScore.score}`, String(data.id));
          setSubmitted(true);
          setShowForm(false);
        }
      } catch (e) {
        console.error('Submit failed:', e);
        // Still show results even if submit fails
        setShowForm(false);
      } finally {
        setSubmitting(false);
      }
    }
    submitResult();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmitForm = async () => {
    setSubmitting(true);
    try {
      const res = await fetchWithFallback('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          totalScore: totalScore.score,
          maxScore: totalScore.max,
          ratio: totalScore.ratio,
          dimensionScores,
          answers,
          respondentName: name,
          respondentPhone: phone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem(`submitted_${grade}_${totalScore.score}`, String(data.id));
        setSubmitted(true);
        setShowForm(false);
        MessagePlugin.success('测评结果已保存！');
      }
    } catch (e) {
      MessagePlugin.error('保存失败，但报告仍可查看');
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Name/Phone form screen
  if (showForm) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--td-bg-color-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ maxWidth: '420px', width: '100%', padding: '20px' }}>
          <Card bordered style={{ borderRadius: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>📋</div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 4px' }}>提交测评结果</h2>
              <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>
                {grade} · 已完成 {Object.keys(answers).length} 题
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#555' }}>
                学生姓名 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <Input
                placeholder="请输入学生姓名"
                value={name}
                onChange={(v) => setName(v as string)}
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#555' }}>
                家长手机号
              </label>
              <Input
                placeholder="选填，用于后续跟进"
                value={phone}
                onChange={(v) => setPhone(v as string)}
                style={{ borderRadius: '8px' }}
              />
              <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>手机号仅用于后续沟通，不会泄露给第三方</p>
            </div>

            <Button
              theme="primary"
              size="large"
              block
              disabled={!name.trim() || submitting}
              onClick={handleSubmitForm}
            >
              {submitting ? '正在保存...' : '提交并查看报告'}
            </Button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Button variant="text" size="small" onClick={() => setShowForm(false)} style={{ color: '#999' }}>
                跳过，直接查看报告
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--td-bg-color-page)' }}>
      {/* Score Overview */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px 60px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>测评报告</h1>
        <p style={{ fontSize: '14px', opacity: 0.8, margin: '0 0 32px' }}>{grade} · 分层综合素养测评</p>

        {submitted && (
          <Tag style={{ background: '#10AC84', color: '#fff', border: 'none', marginBottom: '16px', fontSize: '12px' }}>
            ✅ 结果已保存至后台
          </Tag>
        )}

        <div style={{
          width: '140px', height: '140px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <div style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1 }}>{totalScore.ratio}%</div>
          <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>{totalScore.score}/{totalScore.max} 分</div>
        </div>

        <Tag style={{ background: totalLevel.color, color: '#fff', border: 'none', fontSize: '14px', padding: '4px 20px' }}>
          {totalLevel.label} · {totalLevel.desc}
        </Tag>

        <div style={{ marginTop: '16px', fontSize: '13px', opacity: 0.7 }}>
          完成题数：{Object.keys(answers).length}/{questions.length}
          {name && ` · 学生：${name}`}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '800px', margin: '-20px auto 0', padding: '0 20px 100px', position: 'relative', zIndex: 2 }}>
        {/* Dimension Scores */}
        <Card bordered style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px', color: 'var(--td-text-color-primary)' }}>各维度得分概览</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {dimensionScores.map((dim) => (
              <div key={dim.dim}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dim.color }} />
                    <span style={{ color: 'var(--td-text-color-primary)', fontWeight: 500 }}>{dim.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: dim.level.color, fontWeight: 600, fontSize: '13px' }}>{dim.score}/{dim.maxScore}</span>
                    <Tag style={{ background: dim.level.color + '22', color: dim.level.color, border: 'none', fontSize: '11px', padding: '0 8px' }}>{dim.level.label}</Tag>
                  </div>
                </div>
                <Progress percentage={dim.ratio} color={dim.color} trackColor="var(--td-bg-color-component)" />
              </div>
            ))}
          </div>
        </Card>

        {/* Improvement Suggestions */}
        {weakDimensions.length > 0 && (
          <Card bordered style={{ borderRadius: '16px', marginBottom: '20px', border: '1px solid #FF9F4344' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px', color: '#EE5A24' }}>💪 待提升维度</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {weakDimensions.map((dim) => {
                const dimQuestions = questions.filter((q) => q.dimension === dim.dim);
                const weakQs = dimQuestions.filter((q) => answers[q.number] !== undefined && answers[q.number] < 1);
                return (
                  <div key={dim.dim} style={{ padding: '12px 16px', background: 'var(--td-bg-color-container)', borderRadius: '12px', border: '1px solid var(--td-component-stroke)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{dim.label}</span>
                      <span style={{ fontSize: '13px', color: dim.level.color }}>得分率 {dim.ratio}% · 建议关注</span>
                    </div>
                    {weakQs.length > 0 && (
                      <div style={{ fontSize: '13px', color: 'var(--td-text-color-secondary)', lineHeight: 1.6 }}>
                        需重点关注的方面：
                        <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                          {weakQs.slice(0, 3).map((q) => (<li key={q.number}>{q.scenario}</li>))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Questions Review */}
        <Card bordered style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px', color: 'var(--td-text-color-primary)' }}>📝 答题详情回顾</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {questions.map((q, idx) => {
              const answer = answers[q.number];
              const dimLabel = DIMENSION_LABELS[q.dimension] || q.dimension;
              return (
                <div key={q.number} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--td-component-stroke)', background: 'var(--td-bg-color-container)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: 'var(--td-text-color-secondary)' }}>{idx + 1}. [{dimLabel}]</span>{' '}
                      <span style={{ color: 'var(--td-text-color-primary)' }}>{q.scenario}</span>
                    </div>
                    {answer !== undefined && (
                      <Tag color={answer >= 2 ? '#10AC84' : answer >= 1 ? '#FF9F43' : '#EE5A24'} style={{ flexShrink: 0, fontSize: '12px', padding: '0 10px', color: '#fff', border: 'none' }}>
                        {answer} 分
                      </Tag>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', paddingBottom: '20px' }}>
          <Button theme="primary" size="large" onClick={onRestart} style={{ minWidth: '160px' }}>返回首页，重新测评</Button>
          <Button variant="outline" size="large" onClick={() => window.print()}>打印报告</Button>
        </div>
      </div>
    </div>
  );
}
