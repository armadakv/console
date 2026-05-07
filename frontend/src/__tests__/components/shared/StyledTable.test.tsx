// Copyright JAMF Software, LLC

import { render, screen } from '@testing-library/react';

import { StyledTable } from '../../../components/shared/StyledTable';

const columns = [
  { id: 'name', label: 'Name' },
  { id: 'status', label: 'Status', align: 'center' as const },
  { id: 'size', label: 'Size', align: 'right' as const },
];

describe('StyledTable', () => {
  it('renders column headers', () => {
    render(
      <StyledTable columns={columns}>
        <tr />
      </StyledTable>,
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
  });

  it('renders children in the table body when not empty', () => {
    render(
      <StyledTable columns={columns}>
        <tr>
          <td>row-data</td>
        </tr>
      </StyledTable>,
    );
    expect(screen.getByText('row-data')).toBeInTheDocument();
  });

  it('renders emptyContent when isEmpty=true and emptyContent is provided', () => {
    render(
      <StyledTable
        columns={columns}
        isEmpty
        emptyContent={
          <tr>
            <td>No data</td>
          </tr>
        }
      >
        <tr>
          <td>should not show</td>
        </tr>
      </StyledTable>,
    );
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.queryByText('should not show')).not.toBeInTheDocument();
  });

  it('renders children when isEmpty=true but emptyContent is not provided', () => {
    render(
      <StyledTable columns={columns} isEmpty>
        <tr>
          <td>fallback</td>
        </tr>
      </StyledTable>,
    );
    expect(screen.getByText('fallback')).toBeInTheDocument();
  });

  it('applies className to the container', () => {
    const { container } = render(
      <StyledTable columns={columns} className="my-table">
        <tr />
      </StyledTable>,
    );
    expect(container.querySelector('.my-table')).toBeInTheDocument();
  });

  it('applies text-center class to center-aligned column header', () => {
    render(
      <StyledTable columns={columns}>
        <tr />
      </StyledTable>,
    );
    const statusTh = screen.getByText('Status').closest('th');
    expect(statusTh).toHaveClass('text-center');
  });

  it('applies text-right class to right-aligned column header', () => {
    render(
      <StyledTable columns={columns}>
        <tr />
      </StyledTable>,
    );
    const sizeTh = screen.getByText('Size').closest('th');
    expect(sizeTh).toHaveClass('text-right');
  });

  it('left-aligned column header has no alignment class', () => {
    render(
      <StyledTable columns={columns}>
        <tr />
      </StyledTable>,
    );
    const nameTh = screen.getByText('Name').closest('th');
    expect(nameTh).not.toHaveClass('text-center');
    expect(nameTh).not.toHaveClass('text-right');
  });
});
