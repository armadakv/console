import { clsx } from 'clsx';
import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  isHeader?: boolean;
}

interface TableContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const TableContainer: React.FC<TableContainerProps> = ({ children, className }) => {
  return <div className={clsx('table-container', className)}>{children}</div>;
};

export const Table: React.FC<TableProps> = ({ children, className }) => {
  return <table className={clsx('table', className)}>{children}</table>;
};

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return <thead className={clsx('table-header', className)}>{children}</thead>;
};

export const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return <tbody className={className}>{children}</tbody>;
};

export const TableRow: React.FC<TableRowProps> = ({ children, className, onClick }) => {
  return (
    <tr className={clsx('table-row', onClick && 'cursor-pointer', className)} onClick={onClick}>
      {children}
    </tr>
  );
};

export const TableCell: React.FC<TableCellProps> = ({ children, className, isHeader = false }) => {
  const Component = isHeader ? 'th' : 'td';

  return (
    <Component className={clsx(isHeader ? 'table-header-cell' : 'table-cell', className)}>
      {children}
    </Component>
  );
};
