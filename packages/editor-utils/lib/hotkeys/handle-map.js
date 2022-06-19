"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleMap = void 0;

var _utils = require("./utils");

const handleMap = {
  'delete, backspace'() {
    if (this.currentElement && (this.currentElement.type !== 'mask' || !this.currentElement.url)) {
      this.removeElement(null, null, true);
    } else if (this.currentElement) {
      this.changeElement({
        url: '',
        imageUrl: '',
        resourceType: 'image',
        naturalDuration: 0
      }, this.currentElement);
    }

    return false;
  },

  'left, right, up, down, shift+left, shift+right, shift+up, shift+down'(e) {
    const elements = this.getSelectedElements(true);

    if (!elements.length) {
      return;
    }

    if ((0, _utils.isEditable)(e.target)) {
      return;
    }

    e.preventDefault();
    const code = e.keyCode;
    let offset = code <= 38 ? -1 : 1;
    const dir = Math.abs(code - 38) === 1 ? 'left' : 'top';

    if (e.shiftKey) {
      offset *= 10;
    }

    elements.forEach(element => {
      const props = {};
      props[dir] = element[dir] + offset;
      this.changeElement(props, element);
      element.$draging = true;
      this.$nextTick(() => {
        element.$draging = false;
      });
    });
    return false;
  },

  esc() {
    const contextmenu = this.contextmenu;

    if (contextmenu && contextmenu.isShow) {
      contextmenu.hide();
      return false;
    }

    const currentElement = this.currentElement;

    if (currentElement) {
      if (currentElement.type === '$croper' || currentElement.type === '$masker') {
        this.$events.$emit('element.editCancel', currentElement);
        return false;
      }

      if (currentElement.$editing) {
        currentElement.$editing = false;
        return false;
      }

      this.currentElement = null;
      return false;
    }

    return false;
  },

  enter() {
    const currentElement = this.currentElement;

    if (currentElement) {
      switch (currentElement.type) {
        case 'image':
        case 'mask':
        case 'text':
          this.showElementEditor(currentElement);
          break;

        case '$croper':
        case '$masker':
        case '$watermarker':
          this.$events.$emit('element.editApply', currentElement);
          break;

        case '$selector':
          this.addGroupByElements();
          break;

        case 'group':
          this.flatGroup();
          break;
      }

      return false;
    }
  },

  'ctrl+a, command+a'() {
    const elements = this._getOperateModeElements(this.currentLayout);

    elements.forEach(element => {
      if (!element.frozen && !element.lock && element.dragable) {
        this.selectElement(element);
      }
    });
    this.selectElements(elements);
    return false;
  },

  'ctrl+shift+a, command+shift+a'() {
    this.currentElement = null;
    return false;
  },

  'ctrl+c, command+c'() {
    this.container && this.container.focus();
    this.copyElement();
  },

  'ctrl+x, command+x'() {
    this.container && this.container.focus();
    this.cutElement();
  },

  'ctrl+v, command+v'() {},

  'ctrl+g, command+g'() {
    !this.global.$tempGroup && this.addGroupByElements();
    return false;
  },

  'ctrl+shift+g, command+shift+g'() {
    !this.global.$tempGroup && this.flatGroup();
    return false;
  },

  'ctrl+z, command+z'() {
    if (this.hasUndo) {
      this.undo();
    }

    return false;
  },

  'ctrl+shift+z, command+shift+z, ctrl+y, command+y'() {
    if (this.hasRedo) {
      this.redo();
    }

    return false;
  },

  'ctrl+j, command+j, ctrl+d, command+d'() {
    this.cloneElement();
    return false;
  },

  'ctrl+0, command+0'() {
    this.fitZoom();
    return false;
  },

  'ctrl+1, command+1'() {
    this.zoomTo(1);
    return false;
  },

  'ctrl+2, command+2'() {
    this.zoomTo(2);
    return false;
  },

  'ctrl+-, command+-, ctrl+minus, command+minus'() {
    const zoom = this.zoom - 0.2;
    this.zoomTo(Math.max(0.2, zoom));
    return false;
  },

  'ctrl+=, command+=, ctrl+plus, command+plus'() {
    const zoom = this.zoom + 0.2;
    this.zoomTo(Math.min(4, zoom));
    return false;
  },

  'ctrl+[, command+[, ctrl+down, command+down'() {
    this.backwardElement();
    return false;
  },

  'ctrl+], command+], ctrl+up, command+up'() {
    this.forwardElement();
    return false;
  },

  'ctrl+shift+[, command+shift+[, ctrl+shift+down, command+shift+down'() {
    this.setElementToBottom();
    return false;
  },

  'ctrl+shift+], command+shift+], ctrl+shift+up, command+shift+up'() {
    this.setElementToTop();
    return false;
  },

  'ctrl+l, command+l'(e) {
    e.preventDefault();
    const elements = this.getSelectedElements(true);

    if (elements.length && elements[0].lock) {
      this.unlockElement(elements);
    } else {
      this.lockElement(elements);
    }

    return false;
  },

  'ctrl+shift+/, command+shift+/'() {
    const elements = this.getSelectedElements(true);
    this.unlockElement(elements);
    return false;
  },

  'ctrl+\\, command+\\'() {
    this.mode = this.mode === 'flow' ? 'editor' : 'flow';
    return false;
  },

  space() {
    const elem = this.currentSubElement || this.currentElement;

    if (elem && elem.type === 'video') {
      elem.$playing = !elem.$playing;
    }
  }

};
exports.handleMap = handleMap;