import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/card';

interface QRCodeDisplayProps {
  url: string;
  title: string;
  description?: string;
}

export function QRCodeDisplay({ url, title, description }: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100" style={{ fontFamily: 'Arial, sans-serif' }}>{title}</h2>
      <Card className="p-8 bg-white">
        <div className="relative">
          <QRCodeSVG
            value={url}
            size={256}
            level="H"
            includeMargin={true}
          />
        </div>
      </Card>
    </div>
  );
}