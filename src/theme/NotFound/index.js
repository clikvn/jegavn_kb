import React from 'react';
import NotFoundContent from '@theme/NotFound/Content';
import {PageMetadata} from '@docusaurus/theme-common';

export default function NotFound() {
  return (
    <>
      <PageMetadata title="Page Not Found" />
      <NotFoundContent />
    </>
  );
} 