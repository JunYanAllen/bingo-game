import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
    // 從 Redis 獲取 List，明確指定回傳型別為 string[]
    const drawnNumbers = await redis.lrange<string>('bingo:drawn_numbers', 0, -1);
    return NextResponse.json({ drawnNumbers });
}