import React, { useState, useMemo } from 'react';
import { Button, Progress, Tag, MessagePlugin } from 'tdesign-react';
import { Question, AnswerMap, GradeKey } from '../App';

interface QuestionViewProps {
  grade: GradeKey;
  questions: Question[];
  answers: AnswerMap;
  onAnswer: (number: string, score: number) => void;
  onSubmit: () => void;
}

const GRADE_NAMES_MAP: Record<string, string> = {
  '小学1-2年级': '小学1-2年级',
  '小学3-4年级': '小学3-4年级',
  '小学5-6年级': '小学5-6年级',
  '初一年级': '初一年级',
  '初二年级': '初二年级',
  '初三年级': '初三年级',
};

export function QuestionView({ grade, questions, answers, onAnswer, onSubmit }: QuestionViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  // Parse scoring options from the scoring string
  const scoringOptions = useMemo(() => {
    if (!question?.scoring) return [];
    const options: { label: string; value: number }[] = [];

    // Pattern: "选项描述 + 分数" like "分得清楚 + 2；有点模糊 + 1；完全分不清 0"
    const parts = question.scoring.split(/[；;]/);
    parts.forEach((part) => {
      const trimmed = part.trim();
      if (!trimmed) return;
      // Try to extract score from the end
      const scoreMatch = trimmed.match(/([\d.]+)\s*分?\s*$/);
      if (scoreMatch) {
        const score = parseFloat(scoreMatch[1]);
        const label = trimmed.replace(scoreMatch[0], '').trim();
        options.push({ label: label || `得分 ${score}`, value: score });
      }
    });

    // If parsing failed, try alternative pattern: "A 选项 (+2)"
    if (options.length === 0) {
      const altParts = question.scoring.split(/\s+(?=[A-D]\s)/);
      altParts.forEach((part) => {
        const trimmed = part.trim();
        if (!trimmed) return;
        const scoreMatch = trimmed.match(/\(?[+×]?(\d+(?:\.\d+)?)\)?\s*分?$/);
        if (scoreMatch) {
          const score = parseFloat(scoreMatch[1]);
          const label = trimmed.replace(scoreMatch[0], '').trim();
          options.push({ label: label || `得分 ${score}`, value: score });
        }
      });
    }

    if (options.length === 0) {
      // Fallback: just show the raw scoring text
      options.push({ label: question.scoring, value: 0 });
    }

    return options;
  }, [question]);

  const handleNext = () => {
    if (!answers[question.number] && answers[question.number] !== 0) {
      MessagePlugin.warning('请先选择评分选项');
      return;
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Check all answered
      if (answeredCount < questions.length) {
        MessagePlugin.warning(`还有 ${questions.length - answeredCount} 道题未作答`);
        return;
      }
      // All answered, submit
      onSubmit();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpTo = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    setCurrentIndex(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getUnansweredCount = () => questions.length - answeredCount;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--td-bg-color-page)' }}
    >
      {/* Top Progress Bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--td-bg-color-container)',
          borderBottom: '1px solid var(--td-component-stroke)',
          padding: '12px 20px',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontSize: '13px',
                color: 'var(--td-text-color-secondary)',
              }}
            >
              <span>
                {grade} · 第 {currentIndex + 1}/{questions.length} 题
              </span>
              <span>
                已答 {answeredCount}/{questions.length}
                {getUnansweredCount() > 0 && (
                  <span style={{ color: '#EE5A24', marginLeft: '8px' }}>
                    未答 {getUnansweredCount()} 题
                  </span>
                )}
              </span>
            </div>
            <Progress percentage={Math.round(progress)} />
          </div>

          <select
            value={currentIndex}
            onChange={handleJumpTo}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--td-component-stroke)',
              background: 'var(--td-bg-color-container)',
              color: 'var(--td-text-color-primary)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {questions.map((q, idx) => (
              <option key={q.number} value={idx}>
                {idx + 1}. {answers[q.number] !== undefined ? '✅' : '⬜'}{' '}
                {q.dimension.slice(0, 6)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Question Content */}
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px 20px 100px',
        }}
      >
        {/* Dimension Tag */}
        <Tag
          theme="primary"
          variant="light"
          style={{ marginBottom: '16px', fontSize: '13px' }}
        >
          {question.dimension}
        </Tag>

        {/* Question Number */}
        <div
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            lineHeight: '36px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 700,
            marginBottom: '12px',
          }}
        >
          {question.number}
        </div>

        {/* Scenario */}
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            lineHeight: 1.6,
            margin: '0 0 24px',
            color: 'var(--td-text-color-primary)',
          }}
        >
          {question.scenario}
        </h2>

        {/* Evaluation Standard */}
        <div
          style={{
            background: 'var(--td-bg-color-container)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid var(--td-component-stroke)',
            fontSize: '14px',
            color: 'var(--td-text-color-secondary)',
            lineHeight: 1.6,
          }}
        >
          <span style={{ fontWeight: 600, color: '#667eea' }}>评估参考：</span>
          {question.standard}
        </div>

        {/* Scoring Options */}
        <div style={{ marginBottom: '32px' }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              margin: '0 0 12px',
              color: 'var(--td-text-color-primary)',
            }}
          >
            评分选项
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {scoringOptions.map((option, idx) => {
              const isSelected = answers[question.number] === option.value;
              return (
                <div
                  key={idx}
                  onClick={() => onAnswer(question.number, option.value)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: isSelected
                      ? '2px solid #667eea'
                      : '1px solid var(--td-component-stroke)',
                    background: isSelected
                      ? 'var(--td-brand-color-light)'
                      : 'var(--td-bg-color-container)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '15px',
                      color: 'var(--td-text-color-primary)',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {option.label}
                  </span>
                  <Tag
                    theme={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'light' : 'outline'}
                  >
                    {option.value} 分
                  </Tag>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 20px',
            background: 'var(--td-bg-color-container)',
            borderTop: '1px solid var(--td-component-stroke)',
            zIndex: 100,
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '12px', width: '100%' }}>
            <Button
              variant="outline"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              style={{ flex: 1 }}
            >
              上一题
            </Button>
            <Button
              theme="primary"
              onClick={handleNext}
              style={{ flex: 2 }}
            >
              {currentIndex < questions.length - 1
                ? '下一题'
                : `提交测评 (${answeredCount}/${questions.length})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
