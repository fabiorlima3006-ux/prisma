import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/config/site';
import { OG_IMAGE_ALT, OG_IMAGE_SIZE } from '@/lib/seo/og';

export const alt = OG_IMAGE_ALT;
export const size = OG_IMAGE_SIZE;
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 80,
        background: '#061a36',
        color: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', fontSize: 36, color: '#2fd3ff', letterSpacing: 4 }}>
        {`// ${siteConfig.name.toLowerCase()}`}
      </div>
      <div style={{ display: 'flex', fontSize: 96, fontWeight: 800, marginTop: 16 }}>
        {siteConfig.name}
      </div>
      <div style={{ display: 'flex', fontSize: 52, lineHeight: 1.2, marginTop: 32 }}>
        Entenda o mercado. Analise seus investimentos. Tome decisões mais conscientes.
      </div>
    </div>,
    size,
  );
}
