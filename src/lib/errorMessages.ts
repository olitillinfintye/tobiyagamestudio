export const mapErrorToMessage = (error: any): string => {
  const message = error?.message?.toLowerCase() || '';

  if (message.includes('duplicate key')) {
    return 'This item already exists. Please use a different name or slug.';
  }
  if (message.includes('row-level security')) {
    return 'You do not have permission to perform this action.';
  }
  if (message.includes('not-null') || message.includes('violates not-null')) {
    return 'Please fill in all required fields.';
  }
  if (message.includes('foreign key')) {
    return 'This item is referenced by other data and cannot be modified.';
  }
  if (message.includes('invalid input syntax')) {
    return 'Invalid input. Please check your data and try again.';
  }
  if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
    return 'Invalid email or password.';
  }
  return 'An error occurred. Please try again.';
};
