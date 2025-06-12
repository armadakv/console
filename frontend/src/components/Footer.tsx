import React from 'react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="py-4 mt-auto">
      <div className="border-t border-gray-200 dark:border-gray-700 mb-4" />
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        &copy; {year} Armada Console |{' '}
        <a
          href="https://github.com/armadakv/armada"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
        >
          Armada Project
        </a>
      </p>
    </footer>
  );
};

export default Footer;
