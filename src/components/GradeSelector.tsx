import React from 'react';
import { Card, Tag } from 'tdesign-react';
import { GradeKey } from '../App';

const GRADE_ICONS: Record<string, string> = {
  '小学1-2年级': '🧒',
  '小学3-4年级': '🧑',
  '小学5-6年级': '🧑‍🎓',
  '初一年级': '📚',
  '初二年级': '📚',
  '初三年级': '🎯',
};

const GRADE_COLORS: Record<string, string> = {
  '小学1-2年级': '#FF9F43',
  '小学3-4年级': '#54A0FF',
  '小学5-6年级': '#5F27CD',
  '初一年级': '#00D2D3',
  '初二年级': '#F368E0',
  '初三年级': '#EE5A24',
};

interface GradeSelectorProps {
  grades: GradeKey[];
  onSelect: (grade: GradeKey) => void;
}

export function GradeSelector({ grades, onSelect }: GradeSelectorProps) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--td-bg-color-page)' }}
    >
      {/* Hero Header */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '60px 20px 80px',
        }}
      >
        <div style={{ textAlign: 'center', color: '#fff', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px' }}>
            优德习正
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9, margin: '0 0 4px' }}>
            全学段分层测评系统
          </p>
          <p style={{ fontSize: '14px', opacity: 0.7, margin: 0 }}>
            选择学段，开始分层综合素养测评
          </p>
        </div>
      </div>

      {/* Grade Cards */}
      <div
        style={{
          maxWidth: '1000px',
          margin: '-40px auto 0',
          padding: '0 20px 40px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {grades.map((grade) => (
            <div
              key={grade}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(grade)}
            >
            <Card
              bordered
              hoverShadow
              style={{
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                border: '1px solid var(--td-component-stroke)',
              }}
              theme="poster2"
              cover={
                <div
                  style={{
                    height: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '56px',
                    background: `linear-gradient(135deg, ${GRADE_COLORS[grade]}33 0%, ${GRADE_COLORS[grade]}11 100%)`,
                    borderRadius: '16px 16px 0 0',
                  }}
                >
                  {GRADE_ICONS[grade] || '📖'}
                </div>
              }
            >
              <div style={{ padding: '4px 0' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}>
                  {grade}
                </h3>
                <Tag theme="primary" variant="light">
                  78 道测评题
                </Tag>
                <Tag theme="warning" variant="light" style={{ marginLeft: '8px' }}>
                  约 20 分钟
                </Tag>
              </div>
            </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
