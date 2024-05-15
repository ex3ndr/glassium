import q from './quotes.json';
export function randomQuote() {
    return q[Math.floor(Math.random() * q.length)];
}