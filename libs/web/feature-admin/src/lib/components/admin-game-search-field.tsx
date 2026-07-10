'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Input } from '@gamestore/shared/ui';
import {
  matchesGameSearch,
  useAdminGamesOptions,
  type AdminGameOption,
  type AdminGamesFilter,
} from '../hooks/use-admin-games-options';
import styles from './admin-game-search-field.module.css';

export type AdminGameSearchFieldProps = {
  value: string;
  onChange: (gameId: string) => void;
  disabled?: boolean;
  ariaLabel: string;
  name?: string;
  placeholder?: string;
  className?: string;
  gameFilter?: AdminGamesFilter;
  clearOption?: {
    label: string;
  };
  loadGames?: boolean;
};

export function AdminGameSearchField({
  value,
  onChange,
  disabled = false,
  ariaLabel,
  name,
  placeholder = 'Search games…',
  className,
  gameFilter = 'all',
  clearOption,
  loadGames = true,
}: AdminGameSearchFieldProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { games, loading } = useAdminGamesOptions(gameFilter, loadGames && !disabled);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedGame = useMemo(
    () => games.find((game) => game.id === value) ?? null,
    [games, value],
  );

  const options = useMemo(() => {
    const matches = games.filter((game) => matchesGameSearch(game, query));
    return clearOption
      ? [{ id: '', title: clearOption.label, slug: '' }, ...matches]
      : matches;
  }, [clearOption, games, query]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery(selectedGame?.title ?? '');
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, selectedGame?.title]);

  const displayValue = open ? query : (selectedGame?.title ?? query);

  const selectOption = (option: AdminGameOption) => {
    onChange(option.id);
    setQuery(option.id ? option.title : '');
    setOpen(false);
  };

  const handleInputChange = (nextValue: string) => {
    setQuery(nextValue);
    setOpen(true);
    if (value) {
      onChange('');
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true);
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      setQuery(selectedGame?.title ?? '');
      return;
    }

    if (!open || options.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % options.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? options.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectOption(options[activeIndex]);
    }
  };

  return (
    <div
      ref={rootRef}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-testid="admin-game-search-field"
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <Input
        className={styles.input}
        type="search"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        onFocus={() => {
          setOpen(true);
          setQuery(selectedGame?.title ?? '');
        }}
        onChange={(event) => handleInputChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {open && !disabled ? (
        <ul
          id={listboxId}
          role="listbox"
          className={styles.listbox}
          data-testid="admin-game-search-listbox"
        >
          {loading ? (
            <li className={styles.loadingState}>Loading games…</li>
          ) : options.length === 0 ? (
            <li className={styles.emptyState}>No games match your search.</li>
          ) : (
            options.map((option, index) => {
              const isSelected = option.id === value;
              const isActive = index === activeIndex;
              return (
                <li
                  key={option.id || '__clear__'}
                  role="option"
                  aria-selected={isSelected}
                  className={[
                    styles.option,
                    isActive ? styles.optionActive : '',
                    isSelected ? styles.optionSelected : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  {option.title}
                  {option.slug ? (
                    <span className={styles.optionMeta}>{option.slug}</span>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
