import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';

export default function NotFoundContent({className}) {
  return (
    <main className={clsx('container margin-vert--xl', className)}>
      <div className="row">
        <div className="col col--6 col--offset-3">
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '2rem',
              color: 'var(--ifm-color-primary)'
            }}>
              📄
            </div>
            
            <Heading as="h1" style={{ 
              color: 'var(--ifm-color-primary)', 
              marginBottom: '1rem',
              fontSize: '1rem'
            }}>
              Nội dung tài liệu này sẽ được cập nhật trong thời gian sắp tới
            </Heading>
            
            <p style={{ 
              fontSize: '1.5rem', 
              marginBottom: '3rem', 
              color: 'var(--ifm-color-content)',
              lineHeight: '1.6'
            }}>
              Xin lỗi bạn vì sự bất tiện này, cảm ơn bạn rất nhiều.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                className="button button--primary button--lg"
                to="/"
                style={{ textDecoration: 'none' }}>
                📖 Xem Tài Liệu Khác
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
