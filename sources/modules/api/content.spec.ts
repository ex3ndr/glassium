import { Content, contentCodec } from "./content";

describe('content', () => {
    it('should parse types', () => {

        // Simple text
        let content: Content = { kind: 'text', text: 'hello' };
        contentCodec.parse(content);

        // Recursion
        content = [{ kind: 'text', text: 'hello' }]
        contentCodec.parse(content);
    });

    it('shoudl parse unknown type', () => {
        expect(contentCodec.parse({ 'some': 'invalid' })).toMatchObject({ kind: 'unknown' });
    });
});