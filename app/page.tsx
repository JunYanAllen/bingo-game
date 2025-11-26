"use client";

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import confetti from 'canvas-confetti';

// 定義資料型別
type BoardCell = number | 'FREE';
type Board = BoardCell[][];

interface StatusResponse {
  drawnNumbers: string[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// 產生賓果盤面邏輯
const generateBoard = (): Board => {
  const getColNums = (min: number, max: number): number[] => {
    const nums = new Set<number>();
    while (nums.size < 5) nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
    return Array.from(nums);
  };

  const b = getColNums(1, 15);
  const i = getColNums(16, 30);
  const n = getColNums(31, 45); // Index 2 will be replaced
  const g = getColNums(46, 60);
  const o = getColNums(61, 75);

  const n_col: BoardCell[] = [...n];
  n_col[2] = 'FREE';

  // 轉置矩陣
  const board: Board = [];
  for (let row = 0; row < 5; row++) {
    board.push([b[row], i[row], n_col[row], g[row], o[row]]);
  }
  return board;
};

// 輔助函式：計算連線數
function checkLines(board: Board, drawn: string[]): number {
  let lines = 0;
  const size = 5;
  const isHit = (r: number, c: number) => {
    const cell = board[r][c];
    return cell === 'FREE' || drawn.includes(String(cell));
  };

  // 檢查橫列
  for (let r = 0; r < size; r++) {
    if ([0, 1, 2, 3, 4].every(c => isHit(r, c))) lines++;
  }
  // 檢查直行
  for (let c = 0; c < size; c++) {
    if ([0, 1, 2, 3, 4].every(r => isHit(r, c))) lines++;
  }
  // 檢查對角線
  if ([0, 1, 2, 3, 4].every(idx => isHit(idx, idx))) lines++;
  if ([0, 1, 2, 3, 4].every(idx => isHit(idx, 4 - idx))) lines++;

  return lines;
}

export default function BingoGame() {
  const [board, setBoard] = useState<Board>([]);
  const [isBingo, setIsBingo] = useState<boolean>(false);

  // 每 2 秒輪詢一次
  const { data } = useSWR<StatusResponse>('/api/status', fetcher, { refreshInterval: 2000 });
  const drawnNumbers = data?.drawnNumbers || [];

  useEffect(() => {
    setBoard(generateBoard());
  }, []);

  useEffect(() => {
    if (board.length === 0) return;
    const lines = checkLines(board, drawnNumbers);
    if (lines >= 3 && !isBingo) {
      setIsBingo(true);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [drawnNumbers, board, isBingo]);

  const isChecked = (num: BoardCell) => num === 'FREE' || drawnNumbers.includes(String(num));

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 py-10 px-4">
      <h1 className="text-4xl font-extrabold text-blue-600 mb-6 drop-shadow-sm">🎉 Bingo Party</h1>

      {/* 賓果盤面 */}
      <div className="grid grid-cols-5 gap-2 bg-white p-4 rounded-xl shadow-xl border-4 border-blue-200">
        {['B', 'I', 'N', 'G', 'O'].map(h =>
          <div key={h} className="font-black text-center text-2xl text-gray-700 py-2">{h}</div>
        )}

        {board.flat().map((num, idx) => (
          <div
            key={idx}
            className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-2xl font-bold rounded-full transition-all duration-300
              ${isChecked(num) ? 'bg-yellow-400 text-black scale-110 shadow-[0_0_15px_rgba(250,204,21,0.8)] ring-2 ring-yellow-200' : 'bg-gray-100 text-gray-800'}`}
          >
            {num}
          </div>
        ))}
      </div>

      {isBingo && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-10 rounded-2xl text-center animate-bounce">
            <div className="text-6xl mb-4">🏆</div>
            <div className="text-5xl font-black text-red-600">BINGO!!!</div>
            <div className="text-xl text-gray-500 mt-2">恭喜你達成 3 條連線</div>
          </div>
        </div>
      )}

      {/* 顯示最新號碼提示 */}
      <div className="mt-8 bg-white px-6 py-3 rounded-full shadow-md flex items-center gap-3">
        <span className="text-gray-500">最新號碼</span>
        <span className="font-black text-4xl text-blue-600">{drawnNumbers[drawnNumbers.length - 1] || '-'}</span>
      </div>
    </div>
  );
}