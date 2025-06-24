import { useEffect } from 'react';
import { useHistory } from '@docusaurus/router';

export default function Home() {
  const history = useHistory();

  useEffect(() => {
    // Redirect to docs intro page
    history.replace('/docs/intro');
  }, [history]);

  return null; // Return null since we're redirecting
}
