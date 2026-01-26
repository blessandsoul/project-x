
import sharp from 'sharp';

async function test() {
    console.log('Testing sharp...');
    try {
        const start = Date.now();
        await sharp({
            create: {
                width: 100,
                height: 100,
                channels: 4,
                background: { r: 255, g: 0, b: 0, alpha: 0.5 }
            }
        })
            .png()
            .toBuffer();
        console.log('Sharp worked! took', Date.now() - start, 'ms');
    } catch (e) {
        console.error('Sharp failed:', e);
    }
}

test();
