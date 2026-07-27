import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Placeholder({ title }: { title: string }) {
  const { setBreadcrumbs } = useApp();
  useEffect(() => {
    setBreadcrumbs([{ label: title, path: '#' }]);
  }, [title]);

  return (
    <div className="p-8 text-center text-slate-400">
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm mt-1">This section is not part of the prototype scope.</p>
    </div>
  );
}
