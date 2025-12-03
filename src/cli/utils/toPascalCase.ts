export const toPascalCase = (str: string) => {
  return str.replace(/(^|_)(\w)/g, (_, __, c) => c.toUpperCase());
};
