"use client";

import { useState } from 'react';
import useSWR, { mutate } from 'swr';

interface StatusResponse {
    drawnNumbers: string[];
}

interface ApiErrorResponse {
    message: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // 即使是後台，也需要知道目前開了哪些號碼
    const { data } = useSWR<StatusResponse>('/api/status', fetcher);
    const drawnNumbers = data?.drawnNumbers || [];

    // 簡單的密碼保護
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '8888') {
            setIsAuthenticated(true);
        } else {
            alert('密碼錯誤');
        }
    };

    // 抽號碼功能
    const drawNumber = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/draw', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) {
                const errorData = data as ApiErrorResponse;
                throw new Error(errorData.message || '抽號失敗');
            }

            // 強制更新 SWR 數據
            mutate('/api/status');
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert('發生未知錯誤');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 重置遊戲功能
    const resetGame = async () => {
        if (!confirm('確定要重置遊戲嗎？所有人的盤面號碼將被清空！')) return;

        setIsLoading(true);
        await fetch('/api/draw', { method: 'DELETE' });
        mutate('/api/status');
        setIsLoading(false);
        alert('遊戲已重置');
    };

    // 登入前畫面
    if (!isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
                <form onSubmit={handleLogin} className="flex flex-col gap-4 p-8 bg-gray-800 rounded-lg shadow-xl">
                    <h2 className="text-2xl font-bold text-center">主持人登入</h2>
                    <input
                        type="password"
                        placeholder="請輸入密碼 (預設8888)"
                        className="p-2 rounded text-black"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="bg-blue-600 p-2 rounded hover:bg-blue-500">進入後台</button>
                </form>
            </div>
        );
    }

    // 登入後畫面
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto space-y-8">

                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">🎤 遊戲控制台</h1>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                        已開出 {drawnNumbers.length} 個號碼
                    </div>
                </div>

                {/* 核心控制區 */}
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center space-y-6">
                    <div className="text-gray-500 uppercase tracking-widest text-sm">Current Number</div>
                    <div className="text-8xl font-black text-blue-600">
                        {drawnNumbers.length > 0 ? drawnNumbers[drawnNumbers.length - 1] : '-'}
                    </div>

                    <div className="flex gap-4 justify-center pt-4">
                        <button
                            onClick={drawNumber}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isLoading ? '抽號中...' : '🎲 抽出號碼'}
                        </button>

                        <button
                            onClick={resetGame}
                            disabled={isLoading}
                            className="bg-red-100 hover:bg-red-200 text-red-600 font-bold py-4 px-6 rounded-xl transition-colors"
                        >
                            🔄 重置遊戲
                        </button>
                    </div>
                </div>

                {/* 歷史紀錄區 */}
                <div className="bg-white p-6 rounded-xl shadow text-left">
                    <h3 className="text-gray-500 font-bold mb-4 border-b pb-2">已開號碼紀錄</h3>
                    <div className="flex flex-wrap gap-2">
                        {[...drawnNumbers].reverse().map((num, idx) => (
                            <span key={idx} className={`w-10 h-10 flex items-center justify-center rounded-full font-bold
                ${idx === 0 ? 'bg-blue-600 text-white ring-4 ring-blue-200' : 'bg-gray-100 text-gray-600'}`}>
                                {num}
                            </span>
                        ))}
                        {drawnNumbers.length === 0 && <span className="text-gray-400">尚無紀錄</span>}
                    </div>
                </div>

            </div>
        </div>
    );
}