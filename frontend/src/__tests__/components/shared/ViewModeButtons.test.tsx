// Copyright JAMF Software, LLC

import { render, screen, fireEvent } from '@testing-library/react';

import { ViewModeButtons } from '../../../components/shared/ViewModeButtons';

vi.mock('@/ui/Button', () => ({
  Button: ({ children, onClick, disabled, variant, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

const allValid = { isValidJson: true, isValidXml: true, isValidBase64: true };
const noneValid = { isValidJson: false, isValidXml: false, isValidBase64: false };

describe('ViewModeButtons', () => {
  it('renders four mode buttons', () => {
    render(
      <ViewModeButtons viewMode="text" onViewModeChange={vi.fn()} contentValidation={allValid} />,
    );
    expect(screen.getByText('Raw')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('XML')).toBeInTheDocument();
    expect(screen.getByText('Binary')).toBeInTheDocument();
  });

  it('active mode button has primary variant', () => {
    render(
      <ViewModeButtons viewMode="json" onViewModeChange={vi.fn()} contentValidation={allValid} />,
    );
    expect(screen.getByText('JSON')).toHaveAttribute('data-variant', 'primary');
    expect(screen.getByText('Raw')).toHaveAttribute('data-variant', 'outline');
  });

  it('calls onViewModeChange with the correct mode when clicked', () => {
    const handler = vi.fn();
    render(
      <ViewModeButtons viewMode="text" onViewModeChange={handler} contentValidation={allValid} />,
    );
    fireEvent.click(screen.getByText('JSON'));
    expect(handler).toHaveBeenCalledWith('json');
  });

  it('JSON button is disabled when isValidJson=false', () => {
    render(
      <ViewModeButtons viewMode="text" onViewModeChange={vi.fn()} contentValidation={noneValid} />,
    );
    expect(screen.getByText('JSON')).toBeDisabled();
  });

  it('XML button is disabled when isValidXml=false', () => {
    render(
      <ViewModeButtons viewMode="text" onViewModeChange={vi.fn()} contentValidation={noneValid} />,
    );
    expect(screen.getByText('XML')).toBeDisabled();
  });

  it('Binary button is disabled when isValidBase64=false', () => {
    render(
      <ViewModeButtons viewMode="text" onViewModeChange={vi.fn()} contentValidation={noneValid} />,
    );
    expect(screen.getByText('Binary')).toBeDisabled();
  });

  it('Raw button is never disabled by content validation', () => {
    render(
      <ViewModeButtons viewMode="text" onViewModeChange={vi.fn()} contentValidation={noneValid} />,
    );
    expect(screen.getByText('Raw')).not.toBeDisabled();
  });

  it('all buttons are disabled when disabled=true', () => {
    render(
      <ViewModeButtons
        viewMode="text"
        onViewModeChange={vi.fn()}
        contentValidation={allValid}
        disabled
      />,
    );
    ['Raw', 'JSON', 'XML', 'Binary'].forEach((label) =>
      expect(screen.getByText(label)).toBeDisabled(),
    );
  });
});
