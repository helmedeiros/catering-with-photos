import { TextEncoder, TextDecoder } from 'util';

// Add TextEncoder and TextDecoder to global namespace
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
