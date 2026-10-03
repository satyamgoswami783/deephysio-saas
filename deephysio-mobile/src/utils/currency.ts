export const formatCurrency = (amount: number | string | null | undefined, currency: string = '₹'): string => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return `${currency}0.00`;
  const num = Number(amount);
  return `${currency}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
