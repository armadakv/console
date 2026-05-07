import { render, screen } from '@testing-library/react';

import { Input } from '../../../components/ui/Input';

describe('Input', () => {
  it('renders without label when label prop is absent', () => {
    render(<Input />);
    expect(screen.queryByRole('label')).not.toBeInTheDocument();
  });

  it('renders label text when label prop provided', () => {
    render(<Input label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('label is associated with input via htmlFor/id', () => {
    render(<Input label="Username" id="username-input" />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('renders error message when error prop provided', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('input has border-red-500 class when error present', () => {
    render(<Input error="Invalid value" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('no error message when error is absent', () => {
    render(<Input />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('forwards value and onChange (controlled input)', async () => {
    const onChange = vi.fn();
    render(<Input value="hello" onChange={onChange} readOnly />);
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });

  it('forwards placeholder', () => {
    render(<Input placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
  });

  it('is disabled when disabled prop passed', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
