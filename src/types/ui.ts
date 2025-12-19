export type PageHeaderLinkColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'neutral';

export type PageHeaderLink = {
  label: string;
  icon?: string;
  to?: string;
  href?: string;
  color?: PageHeaderLinkColor;
  onClick?: () => void;
  ariaLabel?: string;
  target?: string;
  disabled?: boolean;
};
