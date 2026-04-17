import { render, screen } from '@testing-library/react';
import App from './App';

test('renders resume analyzer', () => {
  render(<App />);
  expect(screen.getByText(/ai resume analyzer/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /analyze resume/i })).toBeInTheDocument();
});
