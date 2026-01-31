// TypeScript module declaration for importing PNG files
// Allows importing PNGs as modules in TS/TSX files

declare module '*.png' {
  const value: string;
  export default value;
}
