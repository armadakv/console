import React from 'react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="py-4 mt-auto">
      <div className="border-t border-slate-800 mb-4" />
      <p className="text-sm text-slate-500 text-center">
        &copy; {year} Armada Console |{' '}
        <a
          href="https://github.com/armadakv/armada"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-slate-200 underline"
        >
          Armada Project
        </a>
      </p>
    </footer>
  );
};

export default Footer;
