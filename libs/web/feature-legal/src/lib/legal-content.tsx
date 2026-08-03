'use client';

import Link from 'next/link';
import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './legal-page.module.css';

type MarkdownNodeProp = { node?: unknown };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

function extractText(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string') return child;
      if (typeof child === 'number') return String(child);
      if (React.isValidElement(child)) {
        const props = child.props as { children?: React.ReactNode } | undefined;
        return props?.children ? extractText(props.children) : '';
      }
      return '';
    })
    .join('');
}

function headingId(children: React.ReactNode): string {
  return slugify(extractText(children));
}

const internalDocMap: Record<string, string> = {
  './terms-of-service.md': '/terms-of-service',
  './privacy-policy.md': '/privacy-policy',
  './refund-policy.md': '/refund-policy',
};

function MarkdownLink({
  node: _node,
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & MarkdownNodeProp) {
  if (!href) {
    return <a {...props}>{children}</a>;
  }

  const mapped = internalDocMap[href];
  if (mapped) {
    return (
      <Link href={mapped} {...props}>
        {children}
      </Link>
    );
  }

  const isExternal = /^https?:\/\//.test(href);
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}

function HeadingWithId({
  node: _node,
  level,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> &
  MarkdownNodeProp & {
    level: 'h1' | 'h2' | 'h3';
  }) {
  const id = headingId(children);
  const Tag = level;
  return (
    <Tag id={id} className={styles[level]} {...props}>
      {children}
    </Tag>
  );
}

function Paragraph({
  node: _node,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & MarkdownNodeProp) {
  return (
    <p className={styles.paragraph} {...props}>
      {children}
    </p>
  );
}

function UnorderedList({
  node: _node,
  children,
  ...props
}: React.HTMLAttributes<HTMLUListElement> & MarkdownNodeProp) {
  return (
    <ul className={styles.list} {...props}>
      {children}
    </ul>
  );
}

function OrderedList({
  node: _node,
  children,
  ...props
}: React.HTMLAttributes<HTMLOListElement> & MarkdownNodeProp) {
  return (
    <ol className={styles.orderedList} {...props}>
      {children}
    </ol>
  );
}

function ListItem({
  node: _node,
  children,
  ...props
}: React.LiHTMLAttributes<HTMLLIElement> & MarkdownNodeProp) {
  return (
    <li className={styles.listItem} {...props}>
      {children}
    </li>
  );
}

function Blockquote({
  node: _node,
  children,
  ...props
}: React.BlockquoteHTMLAttributes<HTMLQuoteElement> & MarkdownNodeProp) {
  return (
    <blockquote className={styles.blockquote} {...props}>
      {children}
    </blockquote>
  );
}

function HorizontalRule({
  node: _node,
  ...props
}: React.HTMLAttributes<HTMLHRElement> & MarkdownNodeProp) {
  return <hr className={styles.divider} {...props} />;
}

function Strong({
  node: _node,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & MarkdownNodeProp) {
  return (
    <strong className={styles.strong} {...props}>
      {children}
    </strong>
  );
}

function Emphasis({
  node: _node,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & MarkdownNodeProp) {
  return (
    <em className={styles.emphasis} {...props}>
      {children}
    </em>
  );
}

const codeComponent: Components['code'] = ({
  node: _node,
  className,
  children,
  ...props
}) => {
  const isBlock = className?.includes('language-');
  return isBlock ? (
    <code className={[styles.inlineCode, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </code>
  ) : (
    <code className={styles.inlineCode} {...props}>
      {children}
    </code>
  );
};

function TableWrapper({
  node: _node,
  children,
}: React.TableHTMLAttributes<HTMLTableElement> & MarkdownNodeProp) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>{children}</table>
    </div>
  );
}

function TableHeader({
  node: _node,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableHeaderCellElement> & MarkdownNodeProp) {
  return (
    <th className={styles.tableHeader} {...props}>
      {children}
    </th>
  );
}

function TableCell({
  node: _node,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableDataCellElement> & MarkdownNodeProp) {
  return (
    <td className={styles.tableCell} {...props}>
      {children}
    </td>
  );
}

const markdownComponents: Components = {
  h1: (props) => <HeadingWithId level="h1" {...props} />,
  h2: (props) => <HeadingWithId level="h2" {...props} />,
  h3: (props) => <HeadingWithId level="h3" {...props} />,
  p: Paragraph,
  a: MarkdownLink,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  blockquote: Blockquote,
  hr: HorizontalRule,
  strong: Strong,
  em: Emphasis,
  code: codeComponent,
  table: TableWrapper,
  th: TableHeader,
  td: TableCell,
};

export type LegalContentProps = {
  content: string;
};

export function LegalContent({ content }: LegalContentProps) {
  return (
    <article className={styles.legalContent}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
