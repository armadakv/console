import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from '../../../components/ui/Table';

describe('TableContainer', () => {
  it('renders children', () => {
    render(<TableContainer>Content</TableContainer>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies table-container class', () => {
    const { container } = render(<TableContainer>Content</TableContainer>);
    expect(container.firstChild).toHaveClass('table-container');
  });

  it('applies custom className', () => {
    const { container } = render(<TableContainer className="extra">Content</TableContainer>);
    expect(container.firstChild).toHaveClass('extra');
  });
});

describe('Table', () => {
  it('renders as a <table> element with table class', () => {
    const { container } = render(
      <Table>
        <tbody />
      </Table>,
    );
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass('table');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Table className="w-full">
        <tbody />
      </Table>,
    );
    expect(container.querySelector('table')).toHaveClass('w-full');
  });
});

describe('TableHeader', () => {
  it('renders as <thead> with table-header class', () => {
    const { container } = render(
      <table>
        <TableHeader>
          <tr />
        </TableHeader>
      </table>,
    );
    const thead = container.querySelector('thead');
    expect(thead).toBeInTheDocument();
    expect(thead).toHaveClass('table-header');
  });
});

describe('TableBody', () => {
  it('renders as <tbody>', () => {
    const { container } = render(
      <table>
        <TableBody>
          <tr>
            <td>cell</td>
          </tr>
        </TableBody>
      </table>,
    );
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <table>
        <TableBody className="my-body">
          <tr>
            <td>x</td>
          </tr>
        </TableBody>
      </table>,
    );
    expect(container.querySelector('tbody')).toHaveClass('my-body');
  });
});

describe('TableRow', () => {
  it('renders children and applies table-row class', () => {
    render(
      <table>
        <tbody>
          <TableRow>
            <td>Row content</td>
          </TableRow>
        </tbody>
      </table>,
    );
    expect(screen.getByText('Row content')).toBeInTheDocument();
    const row = screen.getByText('Row content').closest('tr');
    expect(row).toHaveClass('table-row');
  });

  it('adds cursor-pointer class when onClick is provided', () => {
    render(
      <table>
        <tbody>
          <TableRow onClick={() => {}}>
            <td>Clickable</td>
          </TableRow>
        </tbody>
      </table>,
    );
    expect(screen.getByText('Clickable').closest('tr')).toHaveClass('cursor-pointer');
  });

  it('does not add cursor-pointer when onClick is absent', () => {
    render(
      <table>
        <tbody>
          <TableRow>
            <td>Static</td>
          </TableRow>
        </tbody>
      </table>,
    );
    expect(screen.getByText('Static').closest('tr')).not.toHaveClass('cursor-pointer');
  });

  it('fires onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <table>
        <tbody>
          <TableRow onClick={onClick}>
            <td>Row</td>
          </TableRow>
        </tbody>
      </table>,
    );
    await user.click(screen.getByText('Row').closest('tr')!);
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('TableCell', () => {
  it('renders as <td> by default with table-cell class', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell>Cell data</TableCell>
          </tr>
        </tbody>
      </table>,
    );
    const cell = screen.getByText('Cell data');
    expect(cell.tagName).toBe('TD');
    expect(cell).toHaveClass('table-cell');
  });

  it('renders as <th> when isHeader is true', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableCell isHeader>Header</TableCell>
          </tr>
        </thead>
      </table>,
    );
    const cell = screen.getByText('Header');
    expect(cell.tagName).toBe('TH');
    expect(cell).toHaveClass('table-header-cell');
  });

  it('applies custom className', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell className="font-bold">Bold</TableCell>
          </tr>
        </tbody>
      </table>,
    );
    expect(screen.getByText('Bold')).toHaveClass('font-bold');
  });
});
