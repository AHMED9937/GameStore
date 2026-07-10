import { act, fireEvent, screen, waitFor } from '@testing-library/react';

export const ADMIN_FILTER_DEBOUNCE_MS = 300;

export async function waitForDebouncedFilters() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ADMIN_FILTER_DEBOUNCE_MS + 50));
  });
}

export function changeSearchFilter(ariaLabel: string, value: string) {
  fireEvent.change(screen.getByLabelText(ariaLabel), { target: { value } });
}

export async function applyDebouncedSearchFilter(
  ariaLabel: string,
  value: string,
) {
  changeSearchFilter(ariaLabel, value);
  await waitForDebouncedFilters();
}

export function changeSelectFilter(ariaLabel: string, value: string) {
  fireEvent.change(screen.getByLabelText(ariaLabel), { target: { value } });
}

export async function waitForFilterApiCall(
  mockFn: { mock: { calls: unknown[][] } },
  expectedArgs: unknown,
) {
  await waitFor(() => {
    expect(mockFn).toHaveBeenLastCalledWith(expectedArgs);
  });
}
