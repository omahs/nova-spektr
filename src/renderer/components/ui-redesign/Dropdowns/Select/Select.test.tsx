import { act, render, screen } from '@testing-library/react';

import Select from './Select';

describe('ui/Dropdowns/Dropdown', () => {
  const options = [
    { id: '0', element: 'label_0', value: '0' },
    { id: '1', element: 'label_1', value: '1' },
  ];
  const defaultProps = {
    activeId: undefined,
    placeholder: 'Select option',
    onChange: () => {},
    options,
  };

  test('should render component', () => {
    render(<Select {...defaultProps} />);

    const button = screen.getByRole('button');
    const placeholder = screen.getByText('Select option');
    expect(button).toBeInTheDocument();
    expect(placeholder).toBeInTheDocument();
  });

  test('should call onSelected', async () => {
    const spySelected = jest.fn();
    render(<Select {...defaultProps} onChange={spySelected} />);

    const button = screen.getByRole('button');
    await act(() => button.click());

    const option = screen.getByRole('option', { name: options[0].element });
    await act(() => option.click());

    expect(spySelected).toBeCalledWith({ id: options[0].id, value: options[0].value });
  });

  // no style for selected option yet
  // test('should render selected option', async () => {
  //   const { rerender } = render(<Select {...defaultProps} />);
  //
  //   const button = screen.getByRole('button');
  //   await act(() => button.click());
  //
  //   let selectedOptions = screen.getAllByRole('option');
  //   selectedOptions.forEach((option) => {
  //     expect(option).not.toHaveClass('bg-shade-5');
  //   });
  //
  //   rerender(<Select {...defaultProps} selectedId={options[1].id} />);
  //
  //   selectedOptions = screen.getAllByRole('option');
  //   expect(selectedOptions[1]).toHaveClass('bg-shade-5');
  // });
});