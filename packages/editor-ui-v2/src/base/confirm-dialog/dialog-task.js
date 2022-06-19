import ConfirmDialog from '../confirm-dialog';
import Vue from 'vue';

const ConfirmDialogApp = Vue.extend(ConfirmDialog);

const confirmDialogTask = {
    queue: [],
    addTask({ title, content, confirmText, cancelText }) {
        const task = {
            content,
            title,
            confirmText,
            cancelText
        };

        task.promise = new Promise((resolve, reject) => {
            task.resolve = resolve;
            task.reject = reject;
        });

        this.queue.push(task);
        this.next();

        return task.promise;
    },
    next() {
        Vue.nextTick(this.runTask, this);
    },
    runTask() {
        const queue = this.queue;
        const task = queue[queue.length - 1];

        if(!task) {
            return;
        }

        const app = this.getConfirmApp();

        // Dialog props
        Object.assign(app, {
            confirmText: task.confirmText,
            cancelText: task.cancelText,
            title: task.title || '',
            content: task.content || ''
        }, task.options);

        app.visible = true;
    },
    getConfirmApp() {
        let app = this.app;

        if(!app) {
            app = new ConfirmDialogApp({
                el: document.createElement('div')
            });

            document.body.appendChild(app.$el);
            app.$on('cancel', () => {
                const task = this.queue.pop();
                app.visible = false;
                if(task) {
                    task.reject();
                }
                this.next();
            });

            app.$on('confirm', () => {
                const task = this.queue.pop();
                app.visible = false;
                if(task) {
                    task.resolve();
                }
                this.next();
            });

            this.app = app;
        }

        return app;
    }
};

export const $confirm = {
    show({ title, content, confirmText, cancelText }) {
        return confirmDialogTask.addTask({ title, content, confirmText, cancelText });
    }
};
