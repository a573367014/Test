import { mount } from '@cypress/vue';
import { GeSlider } from '../src';
import '../src/components/base/slider/style';

// @ts-nocheck
it('base/slider 拖动30%', async () => {
    mount(GeSlider, {
        propsData: {
            value: 0,
        },
    });
    cy.get('.ge-slider__track').then(($el) => {
        console.log($el[0]);
        const el = $el[0];
        const width = el.clientWidth;
        const left = el.offsetLeft;
        console.log(left, width);
        cy.get('.ge-slider__button-wrapper')
            .trigger('mousedown')
            .trigger('mousemove', { clientX: left + (30 / 100) * width, clientY: 0 })
            .trigger('mouseup');
        cy.get('.ge-slider__tail-text').contains('30');
    });
});
