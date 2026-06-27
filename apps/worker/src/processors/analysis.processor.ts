export const nextStates = (current: string) => {
  if (current === 'PENDING') {
    return ['RUNNING_QUICK', 'QUICK_DONE', 'RUNNING_DEEP'];
  }
  if (current === 'RUNNING_DEEP') {
    return ['SUCCEEDED'];
  }
  return [];
};
