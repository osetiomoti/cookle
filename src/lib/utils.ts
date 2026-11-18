export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | { [key: string]: any }
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flatMap((v) => {
      if (!v) return [];
      if (typeof v === 'string' || typeof v === 'number') return [String(v)];
      if (Array.isArray(v)) return [cn(...v)];
      if (typeof v === 'object') {
        return Object.entries(v)
          .filter(([, ok]) => ok)
          .map(([cls]) => cls);
      }
      return [];
    })
    .filter(Boolean)
    .join(' ');
}

/** ランダムな招待コードを生成（8文字英数字大文字） */
export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/** 調理時間を人間が読みやすい形式に変換 */
export function formatCookTime(minutes: number | null | undefined): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}時間${m}分` : `${h}時間`;
}

/** 日付をyyyy/MM/dd形式に変換 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
