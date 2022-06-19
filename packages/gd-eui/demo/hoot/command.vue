<template>
    <div class="command" ref="commandRef">
        <div class="terminal" id="xterm-container"></div>
    </div>
</template>

<script>
import client from '../client';
import { STDOUT_CLOSE, STDOUT } from '../const';
import 'xterm/css/xterm.css';
import { Terminal } from 'xterm';

export default {
    data: () => {
        return {
            list: [],
            input: '',
            commandList: [],
            commandIndex: 0,
            hasClose: false,
            disableStdin: false,
            termOptions: {
                rows: 6,
                scrollback: 5000,
            },
        };
    },
    mounted() {
        const terminal = new Terminal({
            rendererType: 'canvas',
            cursorBlink: true,
            convertEol: true,
            scrollback: this.termOptions.scrollback,
            rows: this.termOptions.rows,
            cursorStyle: 'underline',
            theme: {
                foreground: 'rgb(16, 245, 16)',
                background: '#060101',
                cursor: 'help',
            },
            fontSize: 16,
        });
        terminal.open(document.getElementById('xterm-container'));
        const self = this;
        function runFakeTerminal() {
            if (terminal._initialized) {
                return;
            }

            terminal._initialized = true;

            terminal.prompt = () => {
                terminal.write('\r\n~gd-eui :');
            };

            terminal.writeln('Welcome to gd-eui~');
            prompt(terminal);

            terminal.onKey((e) => {
                const printable =
                    !e.domEvent.altKey &&
                    !e.domEvent.altGraphKey &&
                    !e.domEvent.ctrlKey &&
                    !e.domEvent.metaKey;

                if (e.domEvent.keyCode === 13) {
                    console.log('self.input', self.input);
                    client.sendCommand(self.input);
                    prompt(terminal);
                } else if (e.domEvent.keyCode === 8) {
                    if (terminal._core.buffer.x > 9) {
                        terminal.write('\b \b');
                        self.input = self.input.substring(0, self.input.length - 1);
                    }
                } else if (printable) {
                    self.input = self.input + e.key;
                    terminal.write(e.key);
                }
            });
        }

        function prompt(terminal) {
            terminal.write('\r\n~gd-eui :');
            self.input = '';
        }
        runFakeTerminal();
        client.addMessageListener((key, _data) => {
            if (!_data) {
                return;
            }
            if (key === STDOUT) {
                terminal.writeln(_data.trim());
                terminal.write('\r\n~gd-eui :');
            } else if (key === STDOUT_CLOSE) {
                this.hasClose = false;
            }
        });
    },
    methods: {},
};
</script>

<style lang="less">
.command {
    width: 100%;
    height: 100%;
    background: rgb(10, 10, 32);
    overflow: scroll;
    transition: all 0.3;
    &-span {
        display: flex;
        // padding: 4px 8px;
    }
    &-input {
        width: calc(100% - 70px);
        background-color: #123020;
        border: none;
        margin-left: 8px;
        outline: none;
        color: white;
        caret-color: green;
    }
}
.terminal {
    height: 100%;
}
</style>
