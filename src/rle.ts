export type ParseResult = {
    x: Int32Array;
    y: Int32Array;
    width: number;
    height: number;
};

var /** @const */
    MIN_BUFFER_SIZE = 0x100,
    /**
     * A
     * @const
     */
    MAX_BUFFER_SIZE = 0x1000000,
    /**
     * An estimated guess for the density of a Life pattern, in alive/cell
     * @const
     */
    DENSITY_ESTIMATE = 0.009;

function increase_buf_size(buffer: Int32Array) {
    var new_buffer = new Int32Array((buffer.length * 1.5) | 0);
    new_buffer.set(buffer);
    return new_buffer;
}

export function parserle(
    pattern_string: string,
    width: number,
    height: number
): ParseResult {
    let result: any = {};
    var initial_size = MIN_BUFFER_SIZE;
    let pos = 0;
    let x = 0;
    let y = 0;

    if (result.width && result.height) {
        var size = width * height;

        if (size > 0) {
            initial_size = Math.max(
                initial_size,
                (size * DENSITY_ESTIMATE) | 0
            );
            initial_size = Math.min(MAX_BUFFER_SIZE, initial_size);
        }
    }

    var count = 1,
        in_number = false,
        chr,
        field_x = new Int32Array(initial_size),
        field_y = new Int32Array(initial_size),
        alive_count = 0,
        len = pattern_string.length;

    for (; pos < len; pos++) {
        chr = pattern_string.charCodeAt(pos);

        if (chr >= 48 && chr <= 57) {
            if (in_number) {
                count *= 10;
                count += chr ^ 48;
            } else {
                count = chr ^ 48;
                in_number = true;
            }
        } else {
            if (chr === 98) {
                // b
                x += count;
            } else if ((chr >= 65 && chr <= 90) || (chr >= 97 && chr < 122)) {
                // A-Za-z
                if (alive_count + count > field_x.length) {
                    field_x = increase_buf_size(field_x);
                    field_y = increase_buf_size(field_y);
                }

                while (count--) {
                    field_x[alive_count] = x++;
                    field_y[alive_count] = y;
                    alive_count++;
                }
            } else if (chr === 36) {
                // $
                y += count;
                x = 0;
            } else if (chr === 33) {
                // !
                break;
            }

            count = 1;
            in_number = false;
        }
    }
    //console.timeEnd("parse rle");
    //console.log(initial_size, alive_count);

    result.x = new Int32Array(field_x.buffer, 0, alive_count);
    result.y = new Int32Array(field_y.buffer, 0, alive_count);
    result.width = width;
    result.height = height;

    return result;
}
