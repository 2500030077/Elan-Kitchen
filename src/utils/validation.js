import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from './constants';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmail = (email = '') => EMAIL_REGEX.test(email.trim());

export const passwordChecks = (password = '') => ({
  length: password.length >= 8,
  upper: /[A-Z]/.test(password),
  lower: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: /[^A-Za-z0-9]/.test(password),
});

/** Returns 0–4 strength score and a label. */
export const passwordStrength = (password = '') => {
  if (!password) return { score: 0, label: '' };
  const c = passwordChecks(password);
  let score = [c.length, c.upper && c.lower, c.number, c.special].filter(Boolean).length;
  if (password.length >= 12 && score >= 3) score = 4;
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score] };
};

export const validatePassword = (password = '') => {
  const c = passwordChecks(password);
  if (!password) return 'Password is required.';
  if (!c.length) return 'Password must be at least 8 characters.';
  if (!c.upper) return 'Password must include at least one uppercase letter.';
  if (!c.lower) return 'Password must include at least one lowercase letter.';
  if (!c.number) return 'Password must include at least one number.';
  return '';
};

export const validateName = (name = '') => {
  const n = name.trim();
  if (!n) return 'Full name is required.';
  if (n.length < 2) return 'Name must be at least 2 characters.';
  if (n.length > 60) return 'Name must be 60 characters or fewer.';
  if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(n)) return 'Name may only contain letters, spaces, apostrophes, periods and hyphens.';
  return '';
};

export const validateSignup = ({ name, email, password, confirmPassword, acceptTerms }) => {
  const errors = {};
  const nameErr = validateName(name);
  if (nameErr) errors.name = nameErr;
  if (!email?.trim()) errors.email = 'Email address is required.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address (e.g. name@example.com).';
  const pwErr = validatePassword(password);
  if (pwErr) errors.password = pwErr;
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  if (!acceptTerms) errors.acceptTerms = 'You must accept the terms to create an account.';
  return errors;
};

export const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!email?.trim()) errors.email = 'Email address is required.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return errors;
};

export const validateRecipe = (r) => {
  const errors = {};
  const title = r.title?.trim() || '';
  if (!title) errors.title = 'Recipe title is required.';
  else if (title.length < 3) errors.title = 'Title must be at least 3 characters.';
  else if (title.length > 90) errors.title = 'Title must be 90 characters or fewer.';
  const desc = r.description?.trim() || '';
  if (!desc) errors.description = 'Description is required.';
  else if (desc.length < 20) errors.description = 'Description should be at least 20 characters.';
  if (!r.cuisine) errors.cuisine = 'Select a cuisine.';
  if (!r.categoryId) errors.categoryId = 'Select a category.';
  if (!r.difficulty) errors.difficulty = 'Select a difficulty.';
  if (!r.dietary || r.dietary.length === 0) errors.dietary = 'Select at least one dietary preference.';
  const prep = Number(r.prepTime);
  const cook = Number(r.cookTime);
  const serv = Number(r.servings);
  if (r.prepTime === '' || Number.isNaN(prep) || prep < 0 || prep > 1440) errors.prepTime = 'Enter preparation time in minutes (0–1440).';
  if (r.cookTime === '' || Number.isNaN(cook) || cook < 0 || cook > 1440) errors.cookTime = 'Enter cooking time in minutes (0–1440).';
  if (!r.servings || Number.isNaN(serv) || serv < 1 || serv > 50 || !Number.isInteger(serv)) errors.servings = 'Servings must be a whole number between 1 and 50.';
  if (!r.image) errors.image = 'Add a recipe image (URL or upload).';
  else if (!/^(https?:\/\/|data:image\/|\/)/.test(r.image)) errors.image = 'Image must be a valid http(s) URL or an uploaded image.';
  const ingredients = (r.ingredients || []).filter((i) => i.name?.trim());
  if (ingredients.length === 0) errors.ingredients = 'Add at least one ingredient.';
  else if ((r.ingredients || []).some((i) => i.quantity !== '' && i.quantity !== null && i.quantity !== undefined && (Number.isNaN(Number(i.quantity)) || Number(i.quantity) < 0)))
    errors.ingredients = 'Ingredient quantities must be positive numbers.';
  const steps = (r.steps || []).filter((s) => s?.trim());
  if (steps.length === 0) errors.steps = 'Add at least one cooking step.';
  return errors;
};

export const validateImageFile = (file) => {
  if (!file) return 'No file selected.';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Only JPG, PNG or WebP images are allowed.';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 5 MB or smaller.';
  return '';
};

export const validateContact = ({ name, email, subject, message }) => {
  const errors = {};
  if (!name?.trim()) errors.name = 'Your name is required.';
  if (!email?.trim()) errors.email = 'Email address is required.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (!subject?.trim()) errors.subject = 'Subject is required.';
  if (!message?.trim()) errors.message = 'Message is required.';
  else if (message.trim().length < 10) errors.message = 'Message should be at least 10 characters.';
  return errors;
};
