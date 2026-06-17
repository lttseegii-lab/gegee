// Mongolian SMS templates — keep messages short (≤160 chars for single SMS)

const OCCASION_LABELS: Record<string, string> = {
  birthday:     'төрсөн өдөр',
  anniversary:  'ой',
  mothers_day:  'Эхийн баяр',
  fathers_day:  'Эцгийн баяр',
  graduation:   'төгсөлт',
  just_because: 'баяр',
  memorial:     'дурсгал',
  other:        'тусгай өдөр',
};

const STATUS_LABELS: Record<string, string> = {
  paid:       'хүлээн авлаа',
  preparing:  'бэлтгэгдэж байна',
  shipped:    'хүргэлтэнд гарлаа',
  delivered:  'хүргэгдлээ',
  cancelled:  'цуцлагдлаа',
  refunded:   'буцааж олгогдоно',
};

export function orderStatusSms(orderCode: string, status: string): string | null {
  switch (status) {
    case 'paid':
      return `Таны ${orderCode} захиалга хүлээн авлаа. Бид бэлтгэж эхэллээ! 🌸`;
    case 'preparing':
      return `Таны ${orderCode} захиалга бэлтгэгдэж байна. Удахгүй гарна!`;
    case 'shipped':
      return `Таны ${orderCode} захиалга хүргэлтэнд гарлаа. Удахгүй очих болно 🚗`;
    case 'delivered':
      return `Таны ${orderCode} захиалга хүргэгдлээ. Баярлалаа! 🌸 gegeen.mn`;
    case 'cancelled':
      return `Таны ${orderCode} захиалга цуцлагдлаа. Асуух зүйл байвал бидэнтэй холбоо барина уу.`;
    case 'refunded':
      return `Таны ${orderCode} захиалгын мөнгийг буцааж олгоно. 3-5 ажлын өдөрт орно.`;
    default:
      return null;
  }
}

export function memoryReminderSms(
  personName: string,
  occasion: string,
  daysUntil: number
): string {
  const occasionLabel = OCCASION_LABELS[occasion] ?? 'тусгай өдөр';
  const timing =
    daysUntil === 0 ? 'өнөөдөр тохиож байна' :
    daysUntil === 1 ? 'маргааш тохиож байна' :
    `${daysUntil} хоногийн дараа тохиож байна`;
  return `Сануулга: ${personName}-ийн ${occasionLabel} ${timing}! Цэцэг бэлэглэх үү? gegeen.mn`;
}
