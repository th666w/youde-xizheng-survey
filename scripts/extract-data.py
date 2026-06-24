# -*- coding: utf-8 -*-
"""Extract assessment data from Excel to JSON"""
import openpyxl
import json
import re

EXCEL_PATH = r'C:\Users\asus\Desktop\优德习正・全学段分层测评系统.xlsx'
OUTPUT_PATH = r'C:\Users\asus\WorkBuddy\2026-06-24-13-26-40\youde-xizheng-questionnaire\src\data\assessment-data.json'

# Grade names (proper encoding)
GRADE_NAMES = {
    0: '小学1-2年级',
    1: '小学3-4年级',
    2: '小学5-6年级',
    3: '初一年级',
    4: '初二年级',
    5: '初三年级',
}

DIMENSIONS = [
    '情感感知与人关注',
    '学习能力与自我认知',
    '性格特质',
    '学习接收方式',
    '学习动力与目标',
    '焦虑与抗压',
    '注意力与自律',
    '人际交往与品德',
    '行为习惯',
]

wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)

result = {}

for idx, sheet in enumerate(wb.worksheets):
    if idx >= 6:
        break
    
    grade_name = GRADE_NAMES.get(idx, f'Grade{idx}')
    questions = []
    
    for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
        if not row or row[0] is None:
            continue
        
        q_num = str(row[0]).strip() if row[0] is not None else ''
        dimension = str(row[1]).strip() if len(row) > 1 and row[1] is not None else ''
        scenario = str(row[2]).strip() if len(row) > 2 and row[2] is not None else ''
        scoring = str(row[3]).strip() if len(row) > 3 and row[3] is not None else ''
        standard = str(row[4]).strip() if len(row) > 4 and row[4] is not None else ''
        
        if not scenario or scenario == 'None':
            continue
        
        questions.append({
            'number': q_num,
            'dimension': dimension,
            'scenario': scenario,
            'scoring': scoring,
            'standard': standard,
        })
    
    result[grade_name] = questions
    print(f'{grade_name}: {len(questions)} questions')

with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f'\nTotal grades: {len(result)}')
for g, qs in result.items():
    print(f'  {g}: {len(qs)} questions')
