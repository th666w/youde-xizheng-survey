import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import assessmentData from './data/assessment-data.json';
import { GradeSelector } from './components/GradeSelector';
import { QuestionView } from './components/QuestionView';
import { ResultView } from './components/ResultView';

export type AnswerMap = Record<string, number>;
export type GradeKey = keyof typeof assessmentData;

export interface Question {
  number: string;
  dimension: string;
  scenario: string;
  scoring: string;
  standard: string;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppContent />} />
      <Route path="/questionnaire/:grade" element={<AppContent />} />
      <Route path="/result/:grade" element={<AppContent />} />
    </Routes>
  );
}

function AppContent() {
  const path = window.location.pathname;
  const matchGrade = path.match(/\/questionnaire\/(.+)/);
  const matchResult = path.match(/\/result\/(.+)/);

  const [selectedGrade, setSelectedGrade] = useState<GradeKey | null>(
    matchGrade?.[1] as GradeKey || matchResult?.[1] as GradeKey || null
  );
  const [answers, setAnswers] = useState<AnswerMap>({});

  const grades = Object.keys(assessmentData) as GradeKey[];

  if (matchResult && selectedGrade) {
    const questions = assessmentData[selectedGrade] as Question[];
    return (
      <ResultView
        grade={selectedGrade}
        questions={questions}
        answers={answers}
        onRestart={() => {
          setAnswers({});
          setSelectedGrade(null);
          window.history.pushState(null, '', '/');
        }}
      />
    );
  }

  if (selectedGrade) {
    const questions = assessmentData[selectedGrade] as Question[];
    return (
      <QuestionView
        grade={selectedGrade}
        questions={questions}
        answers={answers}
        onAnswer={(num, score) => {
          setAnswers(prev => ({ ...prev, [num]: score }));
        }}
        onSubmit={() => {
          window.history.pushState(null, '', `/result/${selectedGrade}`);
          // Force re-render
          setAnswers({ ...answers });
        }}
      />
    );
  }

  return (
    <GradeSelector
      grades={grades}
      onSelect={(grade) => {
        setSelectedGrade(grade);
        window.history.pushState(null, '', `/questionnaire/${grade}`);
      }}
    />
  );
}

export default App;
