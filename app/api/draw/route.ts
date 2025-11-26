import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST() {
    const number = await redis.spop<string>('bingo:pool');

    if (!number) {
        return NextResponse.json({ message: '所有號碼已開完' }, { status: 400 });
    }

    await redis.rpush('bingo:drawn_numbers', number);

    return NextResponse.json({ number });
}

export async function DELETE() {
    await redis.del('bingo:drawn_numbers');
    await redis.del('bingo:pool');
    // 建立 1-75 的陣列
    const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
    // sadd 接受多個參數，使用 spread operator
    if (allNumbers.length > 0) {
        await redis.sadd('bingo:pool', ...(allNumbers as [number, ...number[]]));
    }
    return NextResponse.json({ message: '遊戲已重置' });
}